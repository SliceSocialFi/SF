import { STATIC_IMAGES_URL } from "@slice/data/constants";
import { type MouseEvent, useCallback } from "react";
import { Button } from "@/components/Shared/UI";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

interface LoginButtonProps {
  className?: string;
  isBig?: boolean;
  title?: string;
}

const LoginButton = ({
  className = "",
  isBig = false,
  title = "Login"
}: LoginButtonProps) => {
  const { setShowAuthModal } = useAuthModalStore();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      return setShowAuthModal(true);
    },
    [setShowAuthModal]
  );

  return (
    <Button
      className={className}
      onClick={handleClick}
      size={isBig ? "lg" : "md"}
    >
      {title}
    </Button>
  );
};

export default LoginButton;
