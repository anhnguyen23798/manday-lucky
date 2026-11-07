/** Confetti theo skill fun-effects. Import động canvas-confetti (chỉ client). */

const COLORS = ["#2b59ff", "#ffc929", "#ff6a1f", "#27e3a4", "#ff5fa8", "#14110f"]; // = token màu

const EMOJIS = ["🥸", "💪", "👔", "🏆", "🎉"];

export async function celebrate({ reduce = false, big = true }: { reduce?: boolean; big?: boolean } = {}) {
  const confetti = (await import("canvas-confetti")).default;
  const base = { colors: COLORS, disableForReducedMotion: false, zIndex: 1000 };

  if (reduce) {
    void confetti({ ...base, particleCount: 30, spread: 60, origin: { y: 0.6 }, ticks: 120 });
    return;
  }

  const scalar = 2.4;
  const emojis = EMOJIS.map((text) => confetti.shapeFromText({ text, scalar }));

  void confetti({ ...base, particleCount: big ? 140 : 70, spread: 100, startVelocity: 55, origin: { y: 0.6 } });
  setTimeout(() => void confetti({ ...base, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } }), 250);
  setTimeout(() => void confetti({ ...base, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } }), 400);
  setTimeout(
    () =>
      void confetti({
        ...base,
        shapes: emojis,
        scalar,
        particleCount: big ? 36 : 18,
        spread: 160,
        gravity: 0.7,
        origin: { y: 0.3 },
        flat: true,
      }),
    650,
  );
}

/** Mưa ria mép (easter egg) */
export async function mustacheRain() {
  const confetti = (await import("canvas-confetti")).default;
  const scalar = 3;
  const shape = confetti.shapeFromText({ text: "🥸", scalar });
  for (let i = 0; i < 3; i++) {
    setTimeout(
      () =>
        void confetti({
          shapes: [shape],
          scalar,
          particleCount: 30,
          spread: 180,
          startVelocity: 20,
          gravity: 0.6,
          origin: { x: 0.2 + i * 0.3, y: -0.1 },
          flat: true,
          zIndex: 1000,
        }),
      i * 300,
    );
  }
}
