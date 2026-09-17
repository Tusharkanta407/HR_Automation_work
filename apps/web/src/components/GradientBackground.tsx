"use client";

/** Top teal glow background (ReactBD-style). */
export const GradientBackground = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background: "#ffffff",
        backgroundImage:
          "radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #14b8a6 100%)",
        backgroundSize: "100% 100%",
      }}
    />
  );
};
