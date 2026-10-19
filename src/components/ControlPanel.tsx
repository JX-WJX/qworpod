import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

type Props = {
  onBack: () => void;
  onSave: (config: { opacity: number; size: number }) => void;
};

export default function ControlPanel({ onBack, onSave }: Props) {
  const [autostart, setAutostart] = useState(false);
  const [opacity, setOpacity] = useState(0.65);
  const [size, setSize] = useState(180);

  useEffect(() => {
    isEnabled().then(setAutostart).catch(() => setAutostart(false));
    const savedOpacity = localStorage.getItem("qworpod-opacity");
    const savedSize = localStorage.getItem("qworpod-size");
    if (savedOpacity) setOpacity(parseFloat(savedOpacity));
    if (savedSize) setSize(parseInt(savedSize));
  }, []);

  const toggleAutostart = async () => {
    if (autostart) {
      await disable();
      setAutostart(false);
    } else {
      await enable();
      setAutostart(true);
    }
  };

  const handleSave = () => {
    localStorage.setItem("qworpod-opacity", opacity.toString());
    localStorage.setItem("qworpod-size", size.toString());
    onSave({ opacity, size });
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <span className="panel-title">控制面板</span>
      </div>

      <div className="panel-body">
        <div className="control-group">
          <div className="group-label">
            <span>背景透明度</span>
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <input 
            type="range" min="0.2" max="0.9" step="0.05" 
            value={opacity} 
            onChange={(e) => setOpacity(parseFloat(e.target.value))} 
          />
        </div>

        <div className="control-group">
          <div className="group-label">
            <span>胶囊宽度</span>
            <span>{size}px</span>
          </div>
          <input 
            type="range" min="160" max="260" step="10" 
            value={size} 
            onChange={(e) => setSize(parseInt(e.target.value))} 
          />
        </div>

        <div className="control-row">
          <span>开机自启</span>
          <button className={`switch ${autostart ? "on" : "off"}`} onClick={toggleAutostart}>
            <span className="knob" />
          </button>
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-cancel" onClick={onBack}>取消</button>
        <button className="btn-save" onClick={handleSave}>保存并返回</button>
      </div>
    </div>
  );
}