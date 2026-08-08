import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  getStoredTheme,
  STORAGE_KEY,
  THEME_COLOR,
  ThemeContext,
  type Theme,
} from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable — theme still applies for the current session.
    }

    document
      .getElementById('theme-color-meta')
      ?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
