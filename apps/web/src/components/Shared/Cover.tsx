import {
  BRAND_COLOR,
  STATIC_IMAGES_URL,
  TRANSFORMS,
} from "@slice/data/constants";
import imageKit from "@slice/helpers/imageKit";
import sanitizeDStorageUrl from "@slice/helpers/sanitizeDStorageUrl";

interface CoverProps {
  cover: string;
}

const Cover = ({ cover }: CoverProps) => {
  // Check if it's a pattern/default cover (starts with / or contains STATIC_IMAGES_URL)
  const isPattern = cover.startsWith("/") && cover.includes("/patterns/");
  const isDefaultCover = cover === "/cover.png" || isPattern;
  
  // Use the cover as-is if it's default/pattern, otherwise process through imageKit
  const backgroundImage = isDefaultCover
    ? cover
    : imageKit(sanitizeDStorageUrl(cover), TRANSFORMS.COVER);

  const backgroundStyles = {
    backgroundColor: BRAND_COLOR,
    backgroundImage: `url(${backgroundImage})`,
    backgroundPosition: "center center",
    backgroundRepeat: isPattern ? "repeat" : "no-repeat",
    backgroundSize: isPattern ? "30%" : "cover",
  };

  return (
    <div className="mx-auto">
      <div className="h-52 sm:h-64 md:rounded-xl" style={backgroundStyles} />
    </div>
  );
};

export default Cover;
