// apps/web/src/components/Shared/EmojiPicker/index.tsx
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/Shared/UI";
import type { Dispatch, SetStateAction } from "react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import stopEventPropagation from "@/helpers/stopEventPropagation";
import List from "./List";

interface EmojiPickerProps {
  emoji?: null | string;
  setEmoji: (emoji: string) => void;
  setShowEmojiPicker: Dispatch<SetStateAction<boolean>>;
  showEmojiPicker: boolean;
}

const EmojiPicker = ({
  emoji,
  setEmoji,
  setShowEmojiPicker,
  showEmojiPicker
}: EmojiPickerProps) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Tính vị trí panel theo rect của nút (fixed => dùng rect trực tiếp)
  const computePosition = () => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;

    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const panelW = panel.offsetWidth || 300;
    const panelH = panel.offsetHeight || 320;

    let left = rect.left;          // canh trái với nút
    let top = rect.bottom + gap;   // phía dưới nút

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Né tràn phải
    if (left + panelW > vw - 8) left = Math.max(8, vw - panelW - 8);
    // Nếu dưới không đủ chỗ -> hiển thị lên trên nút
    if (top + panelH > vh - 8) top = Math.max(8, rect.top - gap - panelH);

    setPos({ top, left });
  };

  // Sau khi bật panel, chờ mount 1 frame rồi đo vị trí
  useLayoutEffect(() => {
    if (!showEmojiPicker) return;
    const id = requestAnimationFrame(computePosition);
    return () => cancelAnimationFrame(id);
  }, [showEmojiPicker]);

  // Cập nhật vị trí khi scroll/resize
  useEffect(() => {
    if (!showEmojiPicker) return;
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [showEmojiPicker]);

  // Click ngoài & ESC để đóng (vì panel ở portal nên dùng document listener)
  useEffect(() => {
    if (!showEmojiPicker) return;

    const onDocClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      const btn = btnRef.current;
      if (!panel || !btn) return;
      const target = e.target as Node;
      if (panel.contains(target) || btn.contains(target)) return;
      setShowEmojiPicker(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEmojiPicker(false);
    };

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [showEmojiPicker, setShowEmojiPicker]);

  return (
    <Tooltip content="Emoji" placement="top" withDelay>
      <div className="relative">
        <button
          ref={btnRef}
          aria-label="Emoji"
          className="rounded-full outline-offset-8"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            stopEventPropagation(e);
            setShowEmojiPicker(!showEmojiPicker);
          }}
        >
          {emoji ? <span className="text-lg">{emoji}</span> : <FaceSmileIcon className="size-5" />}
        </button>

        {showEmojiPicker &&
          createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1000 }}
              className="w-[300px] rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-hidden
                         dark:border-gray-700 dark:bg-gray-900"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <List
                setEmoji={(em: string) => {
                  setEmoji(em);
                  setShowEmojiPicker(false);
                }}
              />
            </div>,
            document.body
          )}
      </div>
    </Tooltip>
  );
};

export default EmojiPicker;
