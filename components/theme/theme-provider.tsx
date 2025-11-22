'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'dark' | 'light'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

type ThemeProviderProps = {
  children: ReactNode
}

const DARK_MODE_CLASS = 'dark'
const THEME_STORAGE_KEY = '10x-theme'

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle(DARK_MODE_CLASS, theme === 'dark')
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = getStoredTheme()
    const nextTheme = stored ?? 'dark'
    setTheme(nextTheme)
    applyThemeClass(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const nextTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark'
      applyThemeClass(nextTheme)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      }
      return nextTheme
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

