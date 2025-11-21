import { useEffect, useState } from "react";

interface ComposerShellProps {
  children: React.ReactNode;
  animateOnMount?: boolean;
}

const ComposerShell = ({ children, animateOnMount = true }: ComposerShellProps) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!animateOnMount) return;
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, [animateOnMount]);

  return (
    <div
      className="composer-ring rounded-xl"
      data-active={active ? "true" : undefined}
    >
      {children}
    </div>
  );
};

export default ComposerShell;
