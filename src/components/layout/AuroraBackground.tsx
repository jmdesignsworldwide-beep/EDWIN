"use client";

/**
 * AuroraBackground — layered radial "aurora" blobs that slowly drift and
 * breathe. Fixed behind all content. Pure CSS animation (paused under
 * reduced-motion by the global media query). Intensity scales via the
 * per-theme `--aurora-opacity` token.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: "var(--aurora-opacity)" }}
    >
      <div
        className="absolute -left-[15%] -top-[20%] h-[55vh] w-[55vh] animate-aurora-drift rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--aurora-1)) 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute -right-[10%] top-[8%] h-[50vh] w-[50vh] animate-aurora-drift rounded-full blur-3xl [animation-delay:-6s]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--aurora-2)) 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute bottom-[-18%] left-[25%] h-[48vh] w-[48vh] animate-aurora-drift rounded-full blur-3xl [animation-delay:-11s]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--aurora-3)) 0%, transparent 62%)",
        }}
      />
      {/* Breathing veil to soften and pulse the whole field */}
      <div className="absolute inset-0 animate-breathe bg-bg/10" />
    </div>
  );
}
