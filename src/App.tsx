import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import Capsule from "./components/Capsule";
import ExpandedPanel from "./components/ExpandedPanel";
import SettingsPanel from "./components/SettingsPanel";

const COLLAPSED = new LogicalSize(180, 38);
const EXPANDED = new LogicalSize(300, 190);

type Phase = "collapsed" | "expanding" | "expanded" | "collapsing";

export default function App() {
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [showSettings, setShowSettings] = useState(false);
  const [cpu, setCpu] = useState(0);
  const [time, setTime] = useState(new Date());
  const timerRef = useRef<number | null>(null);

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

    if (phase === "expanding") {
      resize(EXPANDED).then(() => {
        timerRef.current = window.setTimeout(() => {
          setPhase("expanded");
        }, 40);
      });
    } else if (phase === "collapsing") {
      timerRef.current = window.setTimeout(() => {
        resize(COLLAPSED).then(() => {
          setPhase("collapsed");
        });
      }, 260);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if ((phase === "expanded" || phase === "expanding") && !el.closest(".island")) {
        setPhase("collapsing");
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phase]);

  const expand = () => {
    if (phase === "collapsed") setPhase("expanding");
  };

  const collapse = () => {
    if (phase === "expanded" || phase === "expanding") setPhase("collapsing");
  };

  const isPanelVisible = phase === "expanded" || phase === "expanding";
  const isCapsuleVisible = phase === "collapsed" || phase === "collapsing";

  return (
    <div className="root">
      <div className={`island ${isPanelVisible ? "expanded" : ""}`}>
        {isPanelVisible && (
          <div className={`content-layer ${phase === "expanded" ? "visible" : ""}`}>
            {showSettings ? (
              <SettingsPanel onBack={() => setShowSettings(false)} />
            ) : (
              <ExpandedPanel
                time={time}
                cpu={cpu}
                onClose={collapse}
                onSettings={() => setShowSettings(true)}
              />
            )}
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