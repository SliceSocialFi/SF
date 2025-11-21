import { STATIC_IMAGES_URL, ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

const getTokenImage = (symbol?: string): string => {
  if (!symbol) {
    return `${STATIC_IMAGES_URL}/tokens/gho.svg`;
  }

  if (symbol === ERC20_TOKEN_SYMBOL) {
    return '/ryf-token-logo.png'
  }

  const symbolLowerCase = symbol?.toLowerCase() || "";
  return `${STATIC_IMAGES_URL}/tokens/${symbolLowerCase}.svg`;
};

export default getTokenImage;
