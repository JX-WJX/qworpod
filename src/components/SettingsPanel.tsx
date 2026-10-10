import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { getVersion } from "@tauri-apps/api/app";

type Props = {
  onBack: () => void;
};

export default function SettingsPanel({ onBack }: Props) {
  const [autostart, setAutostart] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    isEnabled().then(setAutostart).catch(() => setAutostart(false));
    getVersion().then(setVersion).catch(() => setVersion("0.1.0"));
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

  return (
    <div className="settings">
      <div className="settings-row">
        <span className="settings-label">开机自启</span>
        <button className={`switch ${autostart ? "on" : "off"}`} onClick={toggleAutostart}>
          <span className="knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">当前版本</span>
        <span className="settings-value">{version}</span>
      </div>

      <button className="close" onClick={onBack}>返回</button>
    </div>
  );
}