import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Props = {
  time: Date;
  cpu: number;
  onExpand: () => void;
};

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export default function Capsule({ time, cpu, onExpand }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const spawnRipple = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const base = Date.now();

    const r1: Ripple = { id: base, x, y };
    const r2: Ripple = { id: base + 0.001, x, y };

    setRipples((prev) => [...prev, r1, r2]);

    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== r1.id && r.id !== r2.id));
    }, 1200);
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
    const dx = e.screenX - start.current.x;
    const dy = e.screenY - start.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragged.current = true;
      setPressed(false);
      start.current = null;
      // 请求下一帧再触发拖拽，使得拖拽更加平滑跟手
      requestAnimationFrame(() => {
        getCurrentWindow().startDragging().catch(console.error);
      });
    }
  };

  const up = (e: React.PointerEvent) => {
    if (start.current && !dragged.current) onExpand();
    start.current = null;
    setPressed(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const level = cpu < 40 ? "low" : cpu < 75 ? "mid" : "high";

  return (
    <div
      className={`capsule ${pressed ? "pressed" : ""}`}
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