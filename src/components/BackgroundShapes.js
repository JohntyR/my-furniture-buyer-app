"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// How much slower the shapes drift than the page scrolls (0 = fixed, 1 = scrolls normally).
const PARALLAX_SPEED = 0.35;

// Height of one repeating "tile" of shapes. Deliberately taller than any
// realistic browser viewport, so - combined with the 3 stacked copies below -
// the pattern always covers the screen: as one tile's shapes drift past the
// bottom, an identical tile is already in place above to take over, with no
// visible seam (wrapping the scroll offset modulo this height is what makes
// that swap invisible).
const TILE_HEIGHT = 1400;

// Each shape gets its own drift-N class (only applied when `drift` is true) -
// a distinct keyframe/duration/delay combo (defined in globals.css) so they
// move independently instead of bouncing in sync.
function ShapeTile({ drift = false }) {
  const d = (n) => (drift ? `bg-shape-drift-${n}` : "");
  return (
    <div className="relative h-[1400px] w-full shrink-0">
      <div className={`absolute top-10 -right-20 h-72 w-72 rounded-full bg-plum/50 ${d(1)}`} />
      <div
        className={`absolute top-1/3 -left-16 h-40 w-40 rotate-12 rounded-3xl bg-plum/50 ${d(2)}`}
      />
      <div className={`absolute top-[15%] left-[35%] h-20 w-20 rounded-full bg-plum/50 ${d(3)}`} />
      <div
        className={`absolute top-[42%] right-[28%] h-14 w-14 rotate-45 rounded-md bg-plum/50 ${d(4)}`}
      />
      <div
        className={`absolute top-[55%] right-10 h-24 w-24 rotate-45 rounded-xl bg-plum/50 ${d(5)}`}
      />
      <div
        className={`absolute top-[72%] right-[22%] h-28 w-28 rotate-12 rounded-2xl bg-plum/50 ${d(6)}`}
      />
      <div
        className={`absolute bottom-32 -left-24 h-64 w-64 rotate-12 rounded-full bg-plum/50 ${d(7)}`}
      />
      <div
        className={`absolute bottom-16 left-1/2 h-16 w-16 rotate-45 rounded-lg bg-plum/50 ${
          drift ? "bg-shape-drift-8" : "-translate-x-1/2"
        }`}
      />
      <div className={`absolute top-[5%] left-[55%] h-16 w-16 rounded-full bg-plum/50 ${d(9)}`} />
      <div
        className={`absolute top-[28%] right-[8%] h-20 w-20 rotate-12 rounded-2xl bg-plum/50 ${d(10)}`}
      />
      <div className={`absolute top-[62%] left-[10%] h-24 w-24 rounded-full bg-plum/50 ${d(11)}`} />
      <div
        className={`absolute bottom-8 right-[15%] h-20 w-20 rotate-45 rounded-lg bg-plum/50 ${d(12)}`}
      />
      <div className={`absolute top-6 -left-20 h-56 w-56 rounded-full bg-plum/50 ${d(13)}`} />
      <div
        className={`absolute top-[38%] left-[8%] h-16 w-16 rotate-45 rounded-md bg-plum/50 ${d(14)}`}
      />
      <div
        className={`absolute top-[85%] right-[38%] h-20 w-20 rotate-12 rounded-xl bg-plum/50 ${d(15)}`}
      />
      <div
        className={`absolute top-[20%] right-[45%] h-12 w-12 rotate-45 rounded-md bg-plum/50 ${d(16)}`}
      />
      <div
        className={`absolute bottom-[6%] left-[30%] h-14 w-14 rounded-full bg-plum/50 ${d(17)}`}
      />
    </div>
  );
}

// Purely decorative - breaks up the plain page background a little.
// Fixed to the viewport, sits behind all page content, never intercepts clicks.
// On the catalogue page it also drifts as you scroll (a subtle parallax
// effect against the product grid), tiled so it never runs out and scrolls
// off to empty space - see TILE_HEIGHT above. On the assistant, login, and
// orders pages (mostly static, no scroll to hook a parallax off) the shapes
// get a slow ambient drift instead - see the .bg-shape-drift-* CSS animations
// in globals.css.
//
// Performance: the scroll handler only ever writes a single `transform` via a
// ref (no React re-render, no layout/paint - transform is compositor-only)
// and is throttled to once per animation frame with requestAnimationFrame,
// so it can't fire more than the screen's refresh rate however fast the
// browser's native scroll events arrive. The ambient drift is a pure CSS
// animation - no JS runs at all once it starts, and it's disabled entirely
// under prefers-reduced-motion.
export default function BackgroundShapes() {
  const pathname = usePathname();
  const wrapperRef = useRef(null);
  const parallaxEnabled = pathname === "/catalogue";
  const driftEnabled = pathname === "/" || pathname === "/login" || pathname === "/orders";

  useEffect(() => {
    if (!parallaxEnabled) return;

    let ticking = false;

    function applyOffset() {
      if (wrapperRef.current) {
        const offset = (window.scrollY * PARALLAX_SPEED) % TILE_HEIGHT;
        wrapperRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyOffset);
      }
    }

    applyOffset();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (wrapperRef.current) wrapperRef.current.style.transform = "";
    };
  }, [parallaxEnabled]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {parallaxEnabled ? (
        <div ref={wrapperRef} className="absolute inset-x-0" style={{ top: -TILE_HEIGHT }}>
          <ShapeTile />
          <ShapeTile />
          <ShapeTile />
        </div>
      ) : (
        <ShapeTile drift={driftEnabled} />
      )}
    </div>
  );
}
