import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import Capsule from "./components/Capsule";
import ExpandedPanel from "./components/ExpandedPanel";
import ControlPanel from "./components/ControlPanel";

const EXPANDED = new LogicalSize(300, 190);
const SETTINGS = new LogicalSize(320, 380);

type Phase = "collapsed" | "expanding" | "expanded" | "collapsing" | "settings";

export default function App() {
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [cpu, setCpu] = useState(0);
  const [time, setTime] = useState(new Date());
  const timerRef = useRef<number | null>(null);

  const [opacity, setOpacity] = useState(() => {
    const saved = localStorage.getItem("qworpod-opacity");
    return saved ? parseFloat(saved) : 0.65;
  });
  
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("qworpod-size");
    return saved ? parseInt(saved) : 180;
  });

  useEffect(() => {
    const showWindow = async () => {
      const w = getCurrentWindow();
      await w.show();
      await w.setFocus();
    };
    showWindow();

    const t = setInterval(() => setTime(new Date()), 1000);
    const c = setInterval(async () => {
      try {
        const v = await invoke<number>("get_cpu");
        setCpu(v);
      } catch (err) {
        console.error("get_cpu failed:", err);
      }
    }, 2000);
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, []);

  useEffect(() => {
    const w = getCurrentWindow();
    const resize = async (target: LogicalSize) => {
      try {
        const pos = await w.outerPosition();
        const scale = await w.scaleFactor();
        const cur = await w.innerSize();
        const curLogical = cur.toLogical(scale);
        const dx = (target.width - curLogical.width) / 2;
        const dy = (target.height - curLogical.height) / 2;
        await w.setPosition(new LogicalPosition(pos.x / scale - dx, pos.y / scale - dy));
        await w.setSize(target);
      } catch (err) {
        console.error("resize failed:", err);
      }
    };

    const collapsed = new LogicalSize(width, 38);

    if (phase === "expanding") {
      resize(EXPANDED).then(() => {
        timerRef.current = window.setTimeout(() => setPhase("expanded"), 40);
      });
    } else if (phase === "settings") {
      resize(SETTINGS).then(() => {
        timerRef.current = window.setTimeout(() => setPhase("settings"), 40);
      });
    } else if (phase === "collapsing") {
      timerRef.current = window.setTimeout(() => {
        resize(collapsed).then(() => setPhase("collapsed"));
      }, 260);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, width]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if ((phase === "expanded" || phase === "expanding") && !el.closest(".island")) {
        setPhase("collapsing");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phase]);

  const expand = () => {
    if (phase === "collapsed") setPhase("expanding");
  };

  const collapse = () => {
    if (phase === "expanded" || phase === "settings") setPhase("collapsing");
  };

  const handleSaveConfig = (config: { opacity: number; size: number }) => {
    setOpacity(config.opacity);
    setWidth(config.size);
    setPhase("collapsing");
  };

  const isPanelVisible = phase === "expanded" || phase === "expanding";
  const isSettingsVisible = phase === "settings";
  const isCapsuleVisible = phase === "collapsed" || phase === "collapsing";

  return (
    <div 
      className="root" 
      style={{ 
        "--glass-opacity": opacity,
        "--capsule-width": `${width - 20}px` 
      } as React.CSSProperties}
    >
      <div className={`island ${(isPanelVisible || isSettingsVisible) ? "expanded" : ""}`}>
        
        {isPanelVisible && (
          <div className={`content-layer ${phase === "expanded" ? "visible" : ""}`}>
            <ExpandedPanel
              time={time}
              cpu={cpu}
              onClose={collapse}
              onSettings={() => setPhase("settings")}
            />
          </div>
        )}

        {isSettingsVisible && (
          <div className={`content-layer visible`}>
            <ControlPanel 
              onBack={() => setPhase("collapsing")} 
              onSave={handleSaveConfig} 
            />
          </div>
        )}

        {isCapsuleVisible && (
          <div className={`content-layer ${phase === "collapsed" ? "visible" : ""}`}>
            <Capsule time={time} cpu={cpu} onExpand={expand} />
          </div>
        )}
        
      </div>
    </div>
  );
}