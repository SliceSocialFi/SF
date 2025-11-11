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
        `top-[0px] pt-4 pb-1`,
        atTop
          ? "bg-[#000000]"                     
          : "bg-black/40 backdrop-blur-md supports-[backdrop-filter]:bg-black/30" 
      )}
    >
      {children}
    </div>
  );
}
