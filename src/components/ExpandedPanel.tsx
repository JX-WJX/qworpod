type Props = {
  time: Date;
  cpu: number;
  onClose: () => void;
  onSettings: () => void;
};

export default function ExpandedPanel({ time, cpu, onClose, onSettings }: Props) {
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  const pct = Math.max(0, Math.min(cpu, 100));

  return (
    <div className="panel">
      <div className="row">
        <span className="label">TIME</span>
        <span className="value">
          {hh}
          <span className="colon">:</span>
          {mm}
          <span className="colon">:</span>
          {ss}
        </span>
      </div>

      <div className="row">
        <span className="label">CPU</span>
        <span className="value">{cpu.toFixed(1)}%</span>
      </div>

      <div className="bar">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="actions">
        <button className="close" onClick={onSettings}>设置</button>
        <button className="close" onClick={onClose}>收起</button>
      </div>
    </div>
  );
}