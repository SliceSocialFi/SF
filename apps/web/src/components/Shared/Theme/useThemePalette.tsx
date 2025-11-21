import { createContext, useContext, useEffect, useState, type ReactNode, type FC } from "react";
import { PALETTES, type Palette } from "./palettes";

const STORAGE_KEY = "sf_theme_palette";
const STYLE_ID = "theme-overrides";

function injectPalette(p: Palette) {
  const css = `
:root{
  --primary:${p.light.primary};
  --primary-foreground:${p.light.foreground};
  --primary-hover:${p.light.hover};
  --primary-active:${p.light.active};
  --ring: var(--primary);
  --muted:${p.light.muted};
}
.dark{
  --primary:${p.dark.primary};
  --primary-foreground:${p.dark.foreground};
  --primary-hover:${p.dark.hover};
  --primary-active:${p.dark.active};
  --ring: var(--primary);
  --muted:${p.dark.muted};
}`;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

interface ThemePaletteContextValue {
  key: string;
  setKey: (key: string) => void;
  palette: Palette;
  palettes: typeof PALETTES;
}

const ThemePaletteContext = createContext<ThemePaletteContextValue | null>(null);

export const ThemePaletteProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [key, setKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "watermelon";
  });

  useEffect(() => {
    const p = PALETTES[key] ?? PALETTES.watermelon;
    injectPalette(p);
    localStorage.setItem(STORAGE_KEY, key);
  }, [key]);

  return (
    <ThemePaletteContext.Provider
      value={{
        key,
        setKey,
        palette: PALETTES[key] ?? PALETTES.watermelon,
        palettes: PALETTES,
      }}
    >
      {children}
    </ThemePaletteContext.Provider>
  );
};

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (!context) {
    throw new Error("useThemePalette must be used within ThemePaletteProvider");
  }
  return context;
}
