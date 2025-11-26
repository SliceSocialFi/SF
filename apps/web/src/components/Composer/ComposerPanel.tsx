import React, { useEffect, useRef, useState } from "react";
import { useClickAway } from "@uidotdev/usehooks";

interface ComposerPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onDismiss?: () => void;
  onExited?: () => void;
  disableDismiss?: boolean;
  allowOverflow?: boolean;
}

const ComposerPanel = ({
  children,
  isOpen,
  onDismiss,
  onExited,
  disableDismiss = false,
  allowOverflow = false
}: ComposerPanelProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  const clickAwayRef = useClickAway(() => {
    if (!disableDismiss) onDismiss?.();
  }) as React.MutableRefObject<HTMLDivElement>;

  const setRefs = (el: HTMLDivElement | null) => {
    rootRef.current = el;
    // @ts-ignore
    clickAwayRef.current = el;
  };

  // ESC -> đóng
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableDismiss) onDismiss?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disableDismiss, onDismiss]);

  // bật ring mượt khi mở
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(id);
    } else {
      setActive(false);
    }
  }, [isOpen]);

  // chờ đóng xong mới unmount
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== node) return;
      if (!isOpen) onExited?.();
    };
    node.addEventListener("transitionend", onEnd);
    return () => node.removeEventListener("transitionend", onEnd);
  }, [isOpen, onExited]);

  return (
    <div
      ref={setRefs}
      className="composer-panel composer-ring rounded-xl"
      data-open={isOpen ? "true" : undefined}
      data-active={active ? "true" : undefined}
      data-overflow={allowOverflow ? "visible" : undefined}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="composer-panel__inner">{children}</div>
    </div>
  );
};

export default ComposerPanel;