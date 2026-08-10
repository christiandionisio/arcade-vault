"use client";

import { useEffect, useState } from "react";

interface MobileGamepadProps {
  keyMap: {
    up?: string;
    down?: string;
    left?: string;
    right?: string;
    actionA?: string;
    actionB?: string;
  };
  labelA?: string;
  labelB?: string;
  onPause: () => void;
  paused: boolean;
  skins: string[];
  activeSkin: string;
  onSkinChange: (skin: string) => void;
}

function fireKey(code: string, type: "keydown" | "keyup") {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function GamepadButton({
  code,
  label,
  className,
}: {
  code: string;
  label: string;
  className?: string;
}) {
  return (
    <button
      className={`mgp-btn ${className ?? ""}`}
      style={{ touchAction: "none" }}
      onTouchStart={(e) => {
        e.preventDefault();
        fireKey(code, "keydown");
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        fireKey(code, "keyup");
      }}
    >
      {label}
    </button>
  );
}

export default function MobileGamepad({
  keyMap,
  labelA = "A",
  labelB = "B",
  onPause,
  paused,
  skins,
  activeSkin,
  onSkinChange,
}: MobileGamepadProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouchDevice) return null;

  return (
    <div className="mgp-root">
      <div className="mgp-controls">
        {/* D-pad */}
        <div className="mgp-dpad">
          <div />
          {keyMap.up && (
            <GamepadButton
              code={keyMap.up}
              label="▲"
              className="mgp-dpad-btn"
            />
          )}
          <div />
          {keyMap.left && (
            <GamepadButton
              code={keyMap.left}
              label="◀"
              className="mgp-dpad-btn"
            />
          )}
          <div className="mgp-dpad-center" />
          {keyMap.right && (
            <GamepadButton
              code={keyMap.right}
              label="▶"
              className="mgp-dpad-btn"
            />
          )}
          <div />
          {keyMap.down && (
            <GamepadButton
              code={keyMap.down}
              label="▼"
              className="mgp-dpad-btn"
            />
          )}
          <div />
        </div>

        {/* Action buttons */}
        <div className="mgp-actions">
          {keyMap.actionB && (
            <GamepadButton
              code={keyMap.actionB}
              label={labelB}
              className="mgp-action-btn mgp-btn-b"
            />
          )}
          {keyMap.actionA && (
            <GamepadButton
              code={keyMap.actionA}
              label={labelA}
              className="mgp-action-btn mgp-btn-a"
            />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mgp-bar">
        <button
          className="btn ghost mgp-pause-btn"
          style={{ touchAction: "none" }}
          onTouchStart={(e) => {
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
  );
}
