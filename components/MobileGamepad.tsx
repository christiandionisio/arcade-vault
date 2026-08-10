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

function GamepadButton({
  code,
  label,
  className,
  disabled = false,
}: {
  code?: string;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={`mgp-btn ${className ?? ""}${disabled ? " mgp-btn-disabled" : ""}`}
      style={{ touchAction: "none" }}
      disabled={disabled}
      onTouchStart={(e) => {
        if (disabled || !code) return;
        e.preventDefault();
        fireKey(code, "keydown");
      }}
      onTouchEnd={(e) => {
        if (disabled || !code) return;
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
        {/* D-pad: always 9 cells */}
        <div className="mgp-dpad">
          <div />
          <GamepadButton
            code={keyMap.up}
            label="▲"
            className="mgp-dpad-btn"
            disabled={!keyMap.up}
          />
          <div />
          <GamepadButton
            code={keyMap.left}
            label="◀"
            className="mgp-dpad-btn"
            disabled={!keyMap.left}
          />
          <div className="mgp-dpad-center" />
          <GamepadButton
            code={keyMap.right}
            label="▶"
            className="mgp-dpad-btn"
            disabled={!keyMap.right}
          />
          <div />
          <GamepadButton
            code={keyMap.down}
            label="▼"
            className="mgp-dpad-btn"
            disabled={!keyMap.down}
          />
          <div />
        </div>

        {/* Action buttons: always A and B */}
        <div className="mgp-actions">
          <GamepadButton
            code={keyMap.actionB}
            label="B"
            className="mgp-action-btn mgp-btn-b"
            disabled={!keyMap.actionB}
          />
          <GamepadButton
            code={keyMap.actionA}
            label="A"
            className="mgp-action-btn mgp-btn-a"
            disabled={!keyMap.actionA}
          />
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
