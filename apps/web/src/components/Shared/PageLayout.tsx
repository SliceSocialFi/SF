import type { ReactNode } from "react";
import { memo } from "react";
import MetaTags from "@/components/Common/MetaTags";
import SignupButton from "@/components/Shared/Navbar/SignupButton";
import cn from "@/helpers/cn";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import LoginButton from "./LoginButton";
import Search from "./Search";
import Sidebar from "./Sidebar";
import ProfileCard from "@/components/Profile/ProfileCard";

interface AuthButtonsProps {
  className?: string;
}

const AuthButtons = ({ className }: AuthButtonsProps) => {
  const { currentAccount } = useAccountStore();

  if (currentAccount) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-x-2", className)}>
      <SignupButton className="w-full" />
      <LoginButton className="w-full" />
    </div>
  );
};

interface PageLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
  sidebar?: ReactNode;
  hideSearch?: boolean;
  zeroTopMargin?: boolean;
  /** home = followers/following, tasks = reputation + reward */
  profileVariant?: "home" | "tasks";
  /** tắt ProfileCard hoàn toàn (dùng cho trang nào muốn tự sắp vị trí) */
  showProfileCard?: boolean;
}

const PageLayout = ({
  title,
  children,
  description,
  sidebar = <Sidebar />,
  hideSearch = false,
  zeroTopMargin = false,
  profileVariant = "home",
  showProfileCard = true
}: PageLayoutProps) => {
  return (
    <>
      <MetaTags description={description} title={title} />
      <div
        className={cn("mt-0 mb-20 pb-safe flex-1 space-y-5 w-full max-w-full md:mb-5", {
          "md:mt-5": zeroTopMargin,
          "mt-2 md:mt-5": !zeroTopMargin
        })}
      >
        <AuthButtons
          className={cn(
            { "mt-5": zeroTopMargin },
            "w-full md:w-[22.5rem]",
            "ml-auto px-5 md:px-0 lg:hidden"
          )}
        />
        {children}
      </div>

      <aside className="no-scrollbar sticky top-5 mt-5 hidden max-h-screen w-[22.5rem] shrink-0 flex-col gap-y-5 overflow-y-auto overflow-x-clip lg:flex">
        <AuthButtons />
        {!hideSearch && <Search />}
        {showProfileCard && <ProfileCard variant={profileVariant} />}
        {sidebar}
      </aside>
    </>
  );
};

export default memo(PageLayout);
