import { MoonIcon, SunIcon, SwatchIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "@/components/Shared/UI";
import { useTheme } from "@/hooks/useTheme";
import { useThemePalette } from "./useThemePalette";

const ThemeSwitcher: React.FC = () => {
  const { key, setKey, palettes } = useThemePalette();
  const { toggleTheme, theme } = useTheme();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const compute = () => {
    const b = btnRef.current;
    const p = panelRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const gap = 8;
    const w = p?.offsetWidth ?? 240;
    const h = p?.offsetHeight ?? 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.left;
    let top = r.bottom + gap;
    if (left + w > vw - 8) left = Math.max(8, vw - w - 8);
    if (top + h > vh - 8) top = Math.max(8, r.top - gap - h);
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => compute();
    const onResize = () => compute();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const items = Object.entries(palettes); // [key, palette]

  return (
    <>
      <Tooltip content="Theme colors" placement="top" withDelay>
        <button
          ref={btnRef}
          type="button"
          aria-label="Theme colors"
          className="rounded-full outline-offset-8"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <SwatchIcon className="size-6" />
        </button>
      </Tooltip>

      {open &&
        createPortal(
            <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1000 }}
            className="w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xs
                        dark:border-gray-700 dark:bg-[#121212]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            >
            {/* Light/Dark Mode Toggle */}
            <button
              type="button"
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:border-[var(--primary)] dark:hover:bg-[#252525]"
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
                    onClick={() => {
                    setKey(k);
                    setOpen(false);
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
            </div>,
            document.body
        )}
    </>
  );
};

export default ThemeSwitcher;
