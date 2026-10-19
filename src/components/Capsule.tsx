import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Props = {
  time: Date;
  cpu: number;
  onExpand: () => void;
};

type Ripple = { id: number; x: number; y: number; };

export default function Capsule({ time, cpu, onExpand }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const spawnRipple = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 1400);
  };

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.screenX, y: e.screenY };
    dragged.current = false;
    setPressed(true);
    spawnRipple(e);
  };

  const move = async (e: React.PointerEvent) => {
    if (!start.current || dragged.current) return;
    if (Math.hypot(e.screenX - start.current.x, e.screenY - start.current.y) > 4) {
      dragged.current = true;
      setPressed(false);
      start.current = null;
      try {
        await getCurrentWindow().startDragging();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const up = (e: React.PointerEvent) => {
    if (start.current && !dragged.current) onExpand();
    start.current = null;
    setPressed(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const level = cpu < 40 ? "low" : cpu < 75 ? "mid" : "high";

  return (
    <div
      className={`capsule ${pressed ? "pressed" : ""}`}
      style={{ width: "var(--capsule-width)" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {ripples.map((r, i) => (
        <span 
          key={r.id} 
          className={`ripple ${i % 2 === 0 ? "primary" : "secondary"}`} 
          style={{ left: r.x, top: r.y }} 
        />
      ))}
      <span className={`dot ${level}`} />
      <span className="time">
        {hh}
        <span className="colon">:</span>
        {mm}
      </span>
      <span className="sep" />
      <span className="cpu">CPU {cpu.toFixed(0)}%</span>
      <span className="hint" />
    </div>
  );
}