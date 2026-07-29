// Purely decorative - breaks up the plain page background a little.
// Fixed to the viewport, sits behind all page content, never intercepts clicks.
export default function BackgroundShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-plum/50" />
      <div className="absolute top-1/4 -left-16 h-40 w-40 rotate-12 rounded-3xl bg-plum/50" />
      <div className="absolute bottom-24 right-10 h-24 w-24 rotate-45 rounded-xl bg-plum/50" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rotate-12 rounded-full bg-plum/50" />
      <div className="absolute top-2/3 left-1/2 h-16 w-16 -translate-x-1/2 rotate-45 rounded-lg bg-plum/50" />
    </div>
  );
}
