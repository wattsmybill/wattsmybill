import {
  GAME_APPLIANCES,
  MAX_WATTS,
  MIN_WATTS,
  ROUNDS,
  buildRound,
  positionToWatts,
  scoreGuess,
  wattsToPosition,
} from "../app/game/wattsGame.js";

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(GAME_APPLIANCES.length >= 20, `Game pool too small: ${GAME_APPLIANCES.length}`);
check(
  GAME_APPLIANCES.every((item) => item.watts >= MIN_WATTS && item.watts <= MAX_WATTS),
  "A game appliance sits outside the slider's range, making it unguessable.",
);
check(
  !GAME_APPLIANCES.some((item) => /not sure|other \//i.test(item.name)),
  "The pool contains an appliance defined by not knowing its wattage.",
);
const aircons = GAME_APPLIANCES.filter((item) => /aircon/i.test(item.name));
check(aircons.length <= 1, `Pool carries ${aircons.length} aircon variants; the spec-sheet ladder should be excluded.`);

// Scoring must be symmetric in ratio: double and half are equally wrong.
check(scoreGuess(100, 100) === 100, "An exact guess must score 100.");
check(scoreGuess(200, 100) === scoreGuess(50, 100), "Double and half must score alike.");
check(scoreGuess(200, 100) === 50, `A doubled guess should score 50, got ${scoreGuess(200, 100)}`);
check(scoreGuess(400, 100) === 0, `Four times out should score 0, got ${scoreGuess(400, 100)}`);
check(scoreGuess(5000, 100) === 0, "A wild guess must floor at 0, never go negative.");
check(scoreGuess(0, 100) === 0 && scoreGuess(-5, 100) === 0, "Zero and negative guesses must score 0.");
check(scoreGuess(NaN, 100) === 0, "A non-numeric guess must score 0.");

// The same absolute error is judged by scale, which is the whole point.
check(
  scoreGuess(3200, 3000) > scoreGuess(210, 10),
  "Being 200W out on a dryer must beat being 200W out on a bulb.",
);

// Slider round-trips within one snap step across the whole range.
for (const watts of [5, 10, 60, 150, 500, 1000, 1500, 3000]) {
  const back = positionToWatts(wattsToPosition(watts));
  const drift = Math.abs(back - watts) / watts;
  check(drift <= 0.06, `Slider round-trip drifted for ${watts}W: got ${back}W`);
}
check(positionToWatts(0) === MIN_WATTS, `Slider floor should be ${MIN_WATTS}W, got ${positionToWatts(0)}`);
check(positionToWatts(1000) === MAX_WATTS, `Slider ceiling should be ${MAX_WATTS}W, got ${positionToWatts(1000)}`);
check(positionToWatts(-50) === MIN_WATTS && positionToWatts(9999) === MAX_WATTS, "Slider must clamp out-of-range input.");

// Rounds: right count, no repeats, and a genuine spread rather than five kettles.
let sawLow = 0;
let sawHigh = 0;
for (let trial = 0; trial < 400; trial += 1) {
  const round = buildRound();
  check(round.length === ROUNDS, `buildRound returned ${round.length} appliances`);
  check(round.every(Boolean), "buildRound produced an empty slot.");
  const names = new Set(round.map((item) => item.name));
  if (names.size !== ROUNDS) errors.push("buildRound repeated an appliance within one game.");
  if (round.some((item) => item.watts <= 100)) sawLow += 1;
  if (round.some((item) => item.watts >= 1000)) sawHigh += 1;
}
check(sawLow === 400, "Every game must include a low-wattage appliance.");
check(sawHigh === 400, "Every game must include a high-wattage appliance.");

if (errors.length > 0) {
  console.error("Game validation failed:");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log(
  `Game valid: ${GAME_APPLIANCES.length} appliances (${GAME_APPLIANCES[0].watts}W-${GAME_APPLIANCES.at(-1).watts}W), ratio scoring, slider round-trip, and ${ROUNDS}-round spread.`,
);
