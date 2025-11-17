import { MotionConfig, motion } from "motion/react";
import { memo, type ReactNode, KeyboardEvent } from "react";
import cn from "@/helpers/cn";

interface TabsProps {
  tabs: { name: string; type: string; suffix?: ReactNode }[];
  active: string;
  setActive: (type: string) => void;
  layoutId: string;
  className?: string;
}

const Tabs = ({ tabs, active, setActive, layoutId, className }: TabsProps) => {
  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const idx = tabs.findIndex((t) => t.type === active);
    if (idx < 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive(tabs[(idx + 1) % tabs.length].type);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive(tabs[(idx - 1 + tabs.length) % tabs.length].type);
    }
  };

  return (
    <MotionConfig transition={{ bounce: 0, duration: 0.35, type: "spring" }}>
      <motion.ul
        role="tablist"
        aria-label="Home feed tabs"
        onKeyDown={onKey}
        className={cn(
          className,
          "flex w-full list-none flex-wrap justify-center gap-2 px-1 mx-0"
        )}
        layout
      >
        {tabs.map((tab) => {
          const isActive = active === tab.type;
          return (
            <motion.li
              key={tab.type}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              layout
              onClick={() => setActive(tab.type)}
              className={cn(
                "relative cursor-pointer select-none rounded-lg px-3 py-3 text-sm font-medium outline-hidden transition-colors",
                "text-zinc-600 dark:text-zinc-300",
                "hover:text-[var(--primary)] hover:bg-[var(--primary)]/10",
                "active:bg-[var(--primary-active)]/15",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              )}
            >
              {isActive ? (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-lg bg-[var(--primary)]/15 dark:bg-[var(--primary)]/20"
                />
              ) : null}

              <span className={cn("relative z-[1] flex items-center gap-2", isActive && "text-[var(--primary)]")}>
                {tab.name}
                {tab.suffix}
              </span>
            </motion.li>
          );
        })}
      </motion.ul>
    </MotionConfig>
  );
};

export default memo(Tabs);
