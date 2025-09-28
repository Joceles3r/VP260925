import React from "react";

type EmojiBurstProps = {
  emojis: string[];
  count?: number;           // nb de particules
  durationMs?: number;      // durée animation
  spreadPx?: number;        // dispersion
  x?: number;               // origine X en px (relatif au viewport)
  y?: number;               // origine Y en px
  onDone?: () => void;
  reduced?: boolean;
};

// Utilisation typique : <EmojiBurst emojis={["🎬","✨","🍿"]} count={10} x={mouseX} y={mouseY} />
export const EmojiBurst: React.FC<EmojiBurstProps> = ({
  emojis,
  count = 12,
  durationMs = 700,
  spreadPx = 160,
  x,
  y,
  onDone,
  reduced = false
}) => {
  // Réduction douce si prefers-reduced-motion
  const C = Math.max(0, reduced ? Math.min(2, Math.floor(count / 6)) : count);
  const [particles] = React.useState(
    Array.from({ length: C }).map((_, i) => {
      const angle = Math.random() * 2 * Math.PI;
      const dist = (Math.random() ** 0.8) * spreadPx;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist * -1; // vers le haut
      const rot = (Math.random() * 60 - 30).toFixed(1) + "deg";
      const scale = (0.9 + Math.random() * 0.6).toFixed(2);
      const delay = Math.floor(Math.random() * 80);
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      return { dx, dy, rot, scale, delay, emoji };
    })
  );

  React.useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), durationMs + 120);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  const styleRoot: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 60
  };

  const originX = x ?? window.innerWidth / 2;
  const originY = y ?? window.innerHeight / 2;

  return (
    <div style={styleRoot} aria-hidden="true">
      {particles.map((p, idx) => {
        const style: React.CSSProperties & Record<string,string> = {
          position: "absolute",
          left: originX + "px",
          top: originY + "px",
          transform: `translate(-50%,-50%)`,
          animation: `emoji-rise ${durationMs}ms ease-out ${p.delay}ms forwards`,
          // variables custom pour la keyframe
          ["--dx" as any]: p.dx + "px",
          ["--dy" as any]: p.dy + "px",
          ["--rot" as any]: p.rot,
          ["--scale" as any]: p.scale
        };
        return (
          <span key={idx} className="emoji-particle" style={style}>
            {p.emoji}
          </span>
        );
      })}
    </div>
  );
};

export default EmojiBurst;
