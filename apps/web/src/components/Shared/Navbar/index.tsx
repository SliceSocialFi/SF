import {
  BellIcon as BellOutline,
  BookmarkIcon as BookmarkOutline,
  GlobeAltIcon as GlobeOutline,
  HomeIcon as HomeOutline,
  ClipboardDocumentListIcon as TasksOutline,
  UserCircleIcon,
  UserGroupIcon as UserGroupOutline,
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellSolid,
  BookmarkIcon as BookmarkSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeSolid,
  ClipboardDocumentListIcon as TasksSolid,
  UserGroupIcon as UserGroupSolid,
} from "@heroicons/react/24/solid";
import { type MouseEvent, memo, type ReactNode, useCallback } from "react";
import { Link, useLocation } from "react-router";
import { Image, Tooltip } from "@/components/Shared/UI";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SignedAccount from "./SignedAccount";
import ThemeSwitcher from "@/components/Shared/Theme/ThemeSwitcher";

const navigationItems = {
  "/": {
    outline: <HomeOutline className="size-6" />,
    solid: <HomeSolid className="size-6" />,
    title: "Home",
  },
  "/bookmarks": {
    outline: <BookmarkOutline className="size-6" />,
    solid: <BookmarkSolid className="size-6" />,
    title: "Bookmarks",
  },
  "/explore": {
    outline: <GlobeOutline className="size-6" />,
    solid: <GlobeSolid className="size-6" />,
    title: "Explore",
  },
  "/groups": {
    outline: <UserGroupOutline className="size-6" />,
    solid: <UserGroupSolid className="size-6" />,
    title: "Groups",
  },
  "/notifications": {
    outline: <BellOutline className="size-6" />,
    solid: <BellSolid className="size-6" />,
    title: "Notifications",
  },
  "/tasks": {
    outline: <TasksOutline className="size-6" />,
    solid: <TasksSolid className="size-6" />,
    title: "Tasks",
  },
};

const NavItem = memo(({ url, icon }: { url: string; icon: ReactNode }) => (
  <Tooltip content={navigationItems[url as keyof typeof navigationItems].title}>
    <Link to={url}>{icon}</Link>
  </Tooltip>
));

const NavItems = memo(({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { pathname } = useLocation();
  const { unreadCount } = useNotificationStore();
  const routes = [
    "/",
    "/explore",
    ...(isLoggedIn
      ? ["/tasks", "/notifications", "/groups", "/bookmarks"]
      : []),
  ];

  return (
    <>
      {routes.map((route) => {
        const icon =
          pathname === route
            ? navigationItems[route as keyof typeof navigationItems].solid
            : navigationItems[route as keyof typeof navigationItems].outline;

        const iconWithIndicator =
          route === "/notifications" ? (
            <span className="relative">
              {icon}
              {unreadCount > 0 && (
                <span className="-right-1 -top-1 absolute size-2 rounded-full bg-red-500" />
              )}
            </span>
          ) : (
            icon
          );

        return <NavItem icon={iconWithIndicator} key={route} url={route} />;
      })}
    </>
  );
});

const Navbar = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { setShowAuthModal } = useAuthModalStore();

  // Activate notification polling when user is logged in
  useNotificationPolling();

  const handleLogoClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo(0, 0);
      }
    },
    [pathname]
  );

  const handleAuthClick = useCallback(() => {
    setShowAuthModal(true);
  }, [setShowAuthModal]);

  return (
    <aside className="sticky top-5 mt-5 hidden w-10 shrink-0 flex-col items-center gap-y-5 md:flex">
      <Link onClick={handleLogoClick} to="/">
        <Image
          alt="Logo"
          className="size-8"
          height={32}
          src="/favicon.png"
          width={32}
        />
      </Link>

      <NavItems isLoggedIn={!!currentAccount} />

      <ThemeSwitcher />
      {currentAccount ? (
        <>
          {/* <Pro /> */}
          <SignedAccount />
        </>
      ) : (
        <button onClick={handleAuthClick} type="button">
          <Tooltip content="Login">
            <UserCircleIcon className="size-6" />
          </Tooltip>
        </button>
      )}
    </aside>
  );
};

export default memo(Navbar);
