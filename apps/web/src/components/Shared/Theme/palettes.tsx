export type Palette = {
  light: {
    primary: string;
    foreground: string;
    hover: string;
    active: string;
    muted: string;
  };
  dark: {
    primary: string;
    foreground: string;
    hover: string;
    active: string;
    muted: string;
  };
};

export const PALETTES: Record<string, Palette> = {
  watermelon: {
    // mặc định hiện tại
    light: {
      primary: "#FF6B81",
      foreground: "#ffffff",
      hover: "#FFA4B1",
      active: "#E9566B",
      muted: "#FFE4E9",
    },
    dark: {
      primary: "#FF6B81",
      foreground: "#ffffff",
      hover: "#FFA4B1",
      active: "#E9566B",
      muted: "#3f1720",
    },
  },
  coral: {
    light: {
      primary: "#FF7A7A",
      foreground: "#ffffff",
      hover: "#FFB0B0",
      active: "#E05B5B",
      muted: "#FFE5E5",
    },
    dark: {
      primary: "#FF7A7A",
      foreground: "#ffffff",
      hover: "#FFB0B0",
      active: "#E05B5B",
      muted: "#3b1b1b",
    },
  },
  rose: {
    light: {
      primary: "#FB3A5D",
      foreground: "#ffffff",
      hover: "#FF8CA0",
      active: "#E91546",
      muted: "#FFE6EC",
    },
    dark: {
      primary: "#FB3A5D",
      foreground: "#ffffff",
      hover: "#FF8CA0",
      active: "#E91546",
      muted: "#3a0e17",
    },
  },
  blush: {
    light: {
      primary: "#F67599",
      foreground: "#ffffff",
      hover: "#FFABC1",
      active: "#E25C82",
      muted: "#FFE7EF",
    },
    dark: {
      primary: "#F67599",
      foreground: "#ffffff",
      hover: "#FFABC1",
      active: "#E25C82",
      muted: "#3b1a23",
    },
  },
  ruby: {
    light: {
      primary: "#E23A5D",
      foreground: "#ffffff",
      hover: "#F07C94",
      active: "#C92749",
      muted: "#FFE0E6",
    },
    dark: {
      primary: "#E23A5D",
      foreground: "#ffffff",
      hover: "#F07C94",
      active: "#C92749",
      muted: "#351018",
    },
  },
    sunset: {
    light: {
      primary: "#FF8A4C",       // cam hoàng hôn
      foreground: "#ffffff",
      hover: "#FFB58A",
      active: "#E36E2E",
      muted: "#FFF0E5",
    },
    dark: {
      primary: "#FF8A4C",
      foreground: "#ffffff",
      hover: "#FFB58A",
      active: "#E36E2E",
      muted: "#3b2418",
    },
  },

  peach: {
    light: {
      primary: "#FF9E80",       // cam đào nhẹ
      foreground: "#ffffff",
      hover: "#FFBFA8",
      active: "#E57D5E",
      muted: "#FFF2EC",
    },
    dark: {
      primary: "#FF9E80",
      foreground: "#ffffff",
      hover: "#FFBFA8",
      active: "#E57D5E",
      muted: "#3b2620",
    },
  },

  lavender: {
    light: {
      primary: "#C084FC",       // tím pastel
      foreground: "#ffffff",
      hover: "#D8A8FF",
      active: "#A45FE6",
      muted: "#F7EEFF",
    },
    dark: {
      primary: "#C084FC",
      foreground: "#ffffff",
      hover: "#D8A8FF",
      active: "#A45FE6",
      muted: "#2E1F3B",
    },
  },

  sky: {
    light: {
      primary: "#38BDF8",       // xanh da trời tươi
      foreground: "#ffffff",
      hover: "#7DD3FC",
      active: "#0EA5E9",
      muted: "#E0F7FF",
    },
    dark: {
      primary: "#38BDF8",
      foreground: "#ffffff",
      hover: "#7DD3FC",
      active: "#0EA5E9",
      muted: "#122833",
    },
  },

  mint: {
    light: {
      primary: "#34D399",       // xanh bạc hà
      foreground: "#ffffff",
      hover: "#6EE7B7",
      active: "#059669",
      muted: "#E6FFF4",
    },
    dark: {
      primary: "#34D399",
      foreground: "#ffffff",
      hover: "#6EE7B7",
      active: "#059669",
      muted: "#143329",
    },
  },

  gold: {
    light: {
      primary: "#FACC15",       // vàng ánh kim
      foreground: "#000000",
      hover: "#FDE047",
      active: "#EAB308",
      muted: "#FFFBE6",
    },
    dark: {
      primary: "#FACC15",
      foreground: "#000000",
      hover: "#FDE047",
      active: "#EAB308",
      muted: "#3B2F0E",
    },
  },

};
