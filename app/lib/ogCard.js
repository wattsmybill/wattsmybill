import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The shared social card.
 *
 * Every page used to share one static JPEG, so a link to the Philippines rate
 * page and a link to the game were indistinguishable in a feed. These are
 * generated per route at build time instead.
 *
 * Two constraints shape the markup. Satori, which renders these, supports a
 * subset of CSS and needs an explicit `display: flex` on any element with more
 * than one child. And it has no emoji font unless one is fetched at build, so
 * there are no flags here — the mark is drawn as the same three SVG paths the
 * launch animation uses, rather than approximated with a box.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Geist, the same face the site sets, committed as TTF because next/font
// serves woff2 and Satori cannot read it. Reading from disk rather than
// fetching keeps the build independent of the network.
const [geistRegular, geistBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Geist-Regular.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Geist-Bold.ttf")),
]);

const FONTS = [
  { name: "Geist", data: geistRegular, style: "normal", weight: 400 },
  { name: "Geist", data: geistBold, style: "normal", weight: 700 },
];

const BRAND_GRADIENT = "linear-gradient(135deg, #043a33 0%, #087157 62%, #0a7454 100%)";
const AMBER = "#fcd34d";

export function renderCard({ eyebrow, title, subtitle, figure, figureLabel }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BRAND_GRADIENT,
          fontFamily: "Geist",
          padding: "68px 72px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="66" height="66" viewBox="0 0 512 512" style={{ marginRight: 18 }}>
            <path
              d="M212 360 C214 324 196 292 179.4 272.8 A107.5 107.5 0 1 1 356 190.5"
              fill="none"
              stroke="#eaeaea"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M356 197 L300 270 L362 283 L288 370"
              fill="none"
              stroke="#eeb412"
              strokeWidth="40"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="251.5" cy="432" r="24" fill="#eeb412" />
          </svg>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Watts My Bill?
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: AMBER,
                marginBottom: 16,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              fontSize: title.length > 46 ? 62 : 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(236, 253, 245, 0.82)",
                marginTop: 22,
                maxWidth: 900,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 24, color: "rgba(236, 253, 245, 0.7)" }}>
            wattsmybill.app
          </div>

          {figure ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                borderLeft: `4px solid ${AMBER}`,
                paddingLeft: 22,
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em" }}>
                {figure}
              </div>
              {figureLabel ? (
                <div style={{ fontSize: 20, color: "rgba(236, 253, 245, 0.7)", marginTop: 4 }}>
                  {figureLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size, fonts: FONTS },
  );
}
