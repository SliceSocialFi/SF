import { useEffect, useState } from "react";
import clsx from "clsx";

type Props = { children: React.ReactNode; top?: number };

export default function StickyFeedBar({ children, top = 64 }: Props) {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 1);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  return (
    <div
      className={clsx(
        "sticky z-40 transition-colors duration-200",
        `top-[0px] pt-3 pb-3 mb-0`,
        atTop
          ? "bg-[var(--app-bg)]"
          : "bg-[var(--app-bg)]/85 backdrop-blur-sm supports-[backdrop-filter]:bg-[var(--app-bg)]/80"
      )}
    >
      {children}
    </div>
  );
}
