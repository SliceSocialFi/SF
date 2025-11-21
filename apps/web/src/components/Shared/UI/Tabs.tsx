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
    <MotionConfig transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}>
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative cursor-pointer select-none rounded-lg px-3 py-3 text-sm font-medium outline-hidden transition-all duration-200",
                "text-zinc-600 dark:text-zinc-300",
                "border border-transparent",
                "hover:text-[var(--primary)] hover:border-[var(--primary)]/30",
                "active:bg-[var(--primary-active)]/15",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              )}
            >
              {isActive ? (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-[var(--primary)]/15 dark:bg-[var(--primary)]/20 border border-[var(--primary)]/20"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    type: "spring", 
                    stiffness: 350, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                />
              ) : null}

              <span className={cn("relative z-[1] flex items-center gap-2 transition-colors duration-200", isActive && "text-[var(--primary)] font-semibold")}>
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
