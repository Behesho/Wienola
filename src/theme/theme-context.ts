import { createContext } from 'react'

export type Theme = 'dark' | 'light'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const STORAGE_KEY = 'lasten-wien-theme'

export const THEME_COLOR: Record<Theme, string> = {
  dark: '#262626',
  light: '#ffffff',
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function getStoredTheme(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light'
      ? 'light'
      : 'dark'
  } catch {
    return 'dark'
  }
}
