"use client";

import { useEffect, useState, useCallback } from "react";

interface MobileGamepadProps {
  keyMap: {
    up?: string;
    down?: string;
    left?: string;
    right?: string;
    actionA?: string;
    actionB?: string;
  };
  onPause: () => void;
  paused: boolean;
  skins: string[];
  activeSkin: string;
  onSkinChange: (skin: string) => void;
}

const CODE_TO_KEY: Record<string, string> = {
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Space: " ",
  KeyX: "x",
};

function fireKey(code: string, type: "keydown" | "keyup") {
  const key = CODE_TO_KEY[code] ?? code;
  document.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true }));
}

function ArrowSvg({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const paths = {
    up: "M12 4 L20 16 L4 16 Z",
    down: "M4 8 L20 8 L12 20 Z",
    left: "M16 4 L16 20 L4 12 Z",
    right: "M8 4 L20 12 L8 20 Z",
  };
  return (
    <svg className="dp-arrow" viewBox="0 0 24 24">
      <path d={paths[dir]} fill="currentColor" />
    </svg>
  );
}

export default function MobileGamepad({
  keyMap,
  onPause,
  paused,
  skins,
  activeSkin,
  onSkinChange,
}: MobileGamepadProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const press = useCallback((code: string) => {
    setPressed((prev) => new Set(prev).add(code));
    fireKey(code, "keydown");
  }, []);

  const release = useCallback((code: string) => {
    setPressed((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    fireKey(code, "keyup");
  }, []);

  if (!isTouchDevice) return null;

  function dpBtn(dir: "up" | "down" | "left" | "right", code?: string) {
    const isOn = code ? pressed.has(code) : false;
    return (
      <button
        className={`dp dp-${dir}${isOn ? " on" : ""}${!code ? " dp-disabled" : ""}`}
        aria-label={dir}
        onPointerDown={(e) => {
          if (!code) return;
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          press(code);
        }}
        onPointerUp={(e) => {
          if (code) release(code);
        }}
        onPointerLeave={() => {
          if (code && pressed.has(code)) release(code);
        }}
        onPointerCancel={() => {
          if (code) release(code);
        }}
      >
        <ArrowSvg dir={dir} />
      </button>
    );
  }

  function abBtn(letter: "A" | "B", code?: string) {
    const cls = letter === "A" ? "a" : "b";
    const isOn = code ? pressed.has(code) : false;
    return (
      <button
        className={`ab ${cls}${isOn ? " on" : ""}`}
        aria-label={letter}
        onPointerDown={(e) => {
          if (!code) return;
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          press(code);
        }}
        onPointerUp={() => {
          if (code) release(code);
        }}
        onPointerLeave={() => {
          if (code && pressed.has(code)) release(code);
        }}
        onPointerCancel={() => {
          if (code) release(code);
        }}
      >
        <span className="ab-ring" />
        <span className="ab-letter">{letter}</span>
      </button>
    );
  }

  return (
    <div className="mgp-root">
      <div className="gp" role="group" aria-label="Gamepad">
        <div className="gp-body">
          <div className="gp-col gp-col-left">
            <div className="gp-dpad" aria-label="D-pad">
              {dpBtn("up", keyMap.up)}
              {dpBtn("right", keyMap.right)}
              {dpBtn("down", keyMap.down)}
              {dpBtn("left", keyMap.left)}
              <div className="dp-hub" aria-hidden="true">
                <span className="dp-hub-gem" />
              </div>
            </div>
          </div>
          <div className="gp-col gp-col-right">
            <div className="gp-actions">
              {abBtn("B", keyMap.actionB)}
              {abBtn("A", keyMap.actionA)}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mgp-bar">
          <button
            className="btn ghost mgp-pause-btn"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              e.preventDefault();
              onPause();
            }}
          >
            {paused ? "▶ REANUDAR" : "⏸ PAUSA"}
          </button>

          {skins.length > 0 && (
            <select
              value={activeSkin}
              onChange={(e) => onSkinChange(e.target.value)}
              className="pixel text-xs bg-black border border-white/20 text-white px-1 py-0.5 cursor-pointer"
            >
              {skins.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
