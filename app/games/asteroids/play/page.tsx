"use client";

import Script from "next/script";

export default function AsteroidsPlayPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <canvas id="canvas" width={800} height={600} />
      <Script src="/games/asteroids/game.js" strategy="afterInteractive" />
    </main>
  );
}
