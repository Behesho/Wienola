import { useTheme } from '../../theme/useTheme'
import './ThemeSelector.css'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-selector" role="group" aria-label="Darstellung">
      <button
        type="button"
        className={`theme-selector__option${theme === 'dark' ? ' theme-selector__option--active' : ''}`}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
      >
        Dunkel
      </button>
      <button
        type="button"
        className={`theme-selector__option${theme === 'light' ? ' theme-selector__option--active' : ''}`}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
      >
        Hell
      </button>
    </div>
  )
}

export default ThemeSelector
