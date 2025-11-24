import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useThemePalette } from "./useThemePalette";

interface ThemeSwitcherPanelProps {
  onClose?: () => void;
}

const ThemeSwitcherPanel: React.FC<ThemeSwitcherPanelProps> = ({ onClose }) => {
  const { key, setKey, palettes } = useThemePalette();
  const { toggleTheme, theme } = useTheme();

  const items = Object.entries(palettes);

  return (
    <div
      className="w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl
                  dark:border-gray-700 dark:bg-[#121212]"
    >
      {/* Light/Dark Mode Toggle */}
      <button
        type="button"
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm transition hover:bg-gray-500 dark:border-gray-700 dark:hover:bg-black-800"
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
      >
        <span className="text-gray-700 dark:text-gray-300">
          {theme === "light" ? "Dark mode" : "Light mode"}
        </span>
        {theme === "light" ? (
          <MoonIcon className="size-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <SunIcon className="size-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
        Pick a primary palette
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map(([k, p]) => (
          <button
            key={k}
            type="button"
            className={`group w-full overflow-hidden rounded-xl border p-2 text-left transition
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
                        ${k === key ? "border-[var(--primary)]" : "border-gray-200 dark:border-gray-700"}
                        hover:border-[var(--primary)]`}
            onClick={(e) => {
              e.stopPropagation();
              setKey(k);
              if (onClose) onClose();
            }}
          >
            {/* hàng swatch */}
            <div className="mb-1 flex gap-1">
              <span className="inline-block h-4 w-4 rounded" style={{ background: p.light.primary }} />
              <span className="inline-block h-4 w-4 rounded" style={{ background: p.dark.primary }} />
              <span className="inline-block h-4 w-4 rounded" style={{ background: p.light.hover }} />
            </div>

            {/* nhãn: tránh tràn viền */}
            <div className="truncate text-[11px] leading-4 text-gray-600 dark:text-gray-400">
              {k}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcherPanel;
