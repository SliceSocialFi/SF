import { STATIC_IMAGES_URL } from "@slice/data/constants";
import { Image } from "@/components/Shared/UI";

const FullPageLoader = () => {
  return (
    <div className="grid h-screen place-items-center">
      <Image
        alt="Logo"
        className="size-28 animate-pulse"
        height={112}
        src="/favicon.png"
        width={112}
      />
    </div>
  );
};

export default FullPageLoader;
