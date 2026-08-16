/**
 * Launch-screen bootstrap for the installed app.
 *
 * iOS does not reliably report `display-mode: standalone` to CSS, so the class
 * it does understand is set from `navigator.standalone` here — before first
 * paint, or the launch screen would pop in late on exactly the platform where
 * it matters most.
 *
 * This deliberately does NOT remove the launch-screen element afterwards. An
 * earlier version did, and it was a genuine bug: the element is rendered by the
 * root layout, so React owns that node. Deleting it from outside React left the
 * reconciler with a child that no longer existed, and the next update threw
 * NotFoundError on removeChild/insertBefore and took the page down with it.
 * The element is `aria-hidden`, and CSS ends the animation on visibility:hidden
 * with pointer-events:none, so leaving it in place costs nothing — it is out of
 * the accessibility tree and cannot intercept a tap.
 */
export const LAUNCH_SCREEN_SCRIPT = `(function(){try{
if(window.navigator.standalone===true){document.documentElement.classList.add("wmb-standalone")}
}catch(e){}})();`;
