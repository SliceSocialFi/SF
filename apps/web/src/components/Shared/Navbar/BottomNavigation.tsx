import {
  BellIcon,
  ClipboardDocumentListIcon,
  GlobeAltIcon as GlobeOutline,
  HomeIcon,
  MagnifyingGlassIcon,
  SwatchIcon
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeIconSolid
} from "@heroicons/react/24/solid";
import getAvatar from "@slice/helpers/getAvatar";
import type { MouseEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Image } from "@/components/Shared/UI";
import useHasNewNotifications from "@/hooks/useHasNewNotifications";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import { useThemeModalStore } from "@/store/non-persisted/modal/useThemeModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import MobileDrawerMenu from "./MobileDrawerMenu";
import ThemeSwitcherPanel from "@/components/Shared/Theme/ThemeSwitcherPanel";

interface NavigationItemProps {
  path: string;
  label: string;
  outline: ReactNode;
  solid: ReactNode;
  isActive: boolean;
  onClick?: (e: MouseEvent) => void;
  showIndicator?: boolean;
}

const NavigationItem = ({
  path,
  label,
  outline,
  solid,
  isActive,
  onClick,
  showIndicator
}: NavigationItemProps) => (
  <Link
    aria-label={label}
    className="relative mx-auto my-3"
    onClick={onClick}
    to={path}
  >
    {isActive ? solid : outline}
    {showIndicator && (
      <span className="-right-1 -top-1 absolute size-2 rounded-full bg-red-500" />
    )}
  </Link>
);

const BottomNavigation = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { show: showMobileDrawer, setShow: setShowMobileDrawer } =
    useMobileDrawerModalStore();
  const { show: showThemeModal, setShow: setShowThemeModal } = useThemeModalStore();
  const hasNewNotifications = useHasNewNotifications();

  const handleAccountClick = () => setShowMobileDrawer(true);

  const handleHomClick = (path: string, e: MouseEvent) => {
    if (path === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo(0, 0);
    }
  };

  const navigationItems = [
    {
      label: "Home",
      outline: <HomeIcon className="size-6" />,
      path: "/",
      solid: <HomeIconSolid className="size-6" />
    },
    {
      label: "Tasks",
      outline: <ClipboardDocumentListIcon className="size-6" />,
      path: "/tasks",
      solid: <ClipboardDocumentListIconSolid className="size-6" />
    },
    {
      label: "Explore",
      outline: <GlobeOutline className="size-6" />,
      path: "/explore",
      solid: <GlobeSolid className="size-6" />
    },
    {
      label: "Notifications",
      outline: <BellIcon className="size-6" />,
      path: "/notifications",
      solid: <BellIconSolid className="size-6" />
    }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[5] border-gray-200 border-t bg-white pb-safe md:hidden dark:border-gray-800 dark:bg-black">
      {showMobileDrawer && <MobileDrawerMenu />}
      {showThemeModal && (
        <div className="fixed inset-0 z-10 bg-black/50" onClick={() => setShowThemeModal(false)}>
          <div className="fixed bottom-[4.5rem] right-3" onClick={(e) => e.stopPropagation()}>
            <ThemeSwitcherPanel onClose={() => setShowThemeModal(false)} />
          </div>
        </div>
      )}
      <div className="flex justify-between">
        {navigationItems.map(({ path, label, outline, solid }) => (
          <NavigationItem
            isActive={pathname === path}
            key={path}
            label={label}
            onClick={(e) => handleHomClick(path, e)}
            outline={outline}
            path={path}
            showIndicator={hasNewNotifications && path === "/notifications"}
            solid={solid}
          />
        ))}
        <button
          aria-label="Theme settings"
          className="relative mx-auto my-3"
          onClick={() => setShowThemeModal(!showThemeModal)}
          type="button"
        >
          <SwatchIcon className="size-6" />
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
