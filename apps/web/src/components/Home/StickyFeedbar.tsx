import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

type Props = { 
  header?: React.ReactNode;
  tabs?: React.ReactNode;
  children?: React.ReactNode;
  top?: number;
};

export default function StickyFeedBar({ header, tabs, children, top = 64 }: Props) {
  const [atTop, setAtTop] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollDirection = useRef<'up' | 'down' | null>(null);

  // Nếu dùng children mode (không có header/tabs riêng), chỉ render children
  const isChildrenMode = !!children && !header && !tabs;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setAtTop(currentScrollY <= 1);
          
          // Chỉ làm scroll animation cho mobile
          if (isMobile && !isChildrenMode) {
            const scrollDiff = currentScrollY - lastScrollY.current;
            
            if (currentScrollY < 10) {
              setHideHeader(false);
              scrollDirection.current = null;
            }
            else if (scrollDiff > 2) {
              if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
              }
              if (currentScrollY > 50) {
                setHideHeader(true);
              }
            }
            else if (scrollDiff < -2) {
              if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
              }
              setHideHeader(false);
            }
            
            lastScrollY.current = currentScrollY;
          }
          
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile, isChildrenMode]);
  
  // Nếu dùng children mode, render đơn giản với transparent backdrop
  if (isChildrenMode) {
    return (
      <div
        className="sticky top-0 z-10 w-full max-w-full pt-4 pb-3"
        style={{
          background: atTop 
            ? 'var(--app-bg)' 
            : 'rgba(var(--app-bg-rgb), 0.85)',
          backdropFilter: atTop ? 'none' : 'blur(12px)',
          WebkitBackdropFilter: atTop ? 'none' : 'blur(12px)',
        }}
      >
        {children}
      </div>
    );
  }
  
  return (
    <div
      className={clsx(
        "sticky z-10 transition-colors duration-200",
        "top-0 w-full max-w-full",
        isMobile && "overflow-hidden"
      )}
      style={isMobile ? {
        height: atTop ? '136px' : '72px',
        minHeight: atTop ? '136px' : '72px',
        background: atTop 
          ? 'var(--app-bg)' 
          : 'rgba(var(--app-bg-rgb), 0.85)',
        backdropFilter: atTop ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: atTop ? 'none' : 'blur(12px)',
        transition: 'height 0.2s ease-out',
      } : {
        background: atTop 
          ? 'var(--app-bg)' 
          : 'rgba(var(--app-bg-rgb), 0.85)',
        backdropFilter: atTop ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: atTop ? 'none' : 'blur(12px)',
      }}
    >
      <div 
        className="w-full will-change-transform"
        style={isMobile ? {
          transform: atTop || !hideHeader ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.2s ease-out',
        } : undefined}
      >
        {header}
      </div>
      <div 
        className="pb-3 will-change-transform"
        style={isMobile ? {
          transform: atTop || !hideHeader ? 'translateY(0)' : 'translateY(-64px)',
          transition: 'transform 0.2s ease-out',
          paddingTop: '16px',
        } : {
          paddingTop: '16px',
        }}
      >
        {tabs}
      </div>
    </div>
  );
}
