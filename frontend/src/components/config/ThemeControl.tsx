import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui'
import { useTheme } from './ThemeProvider'
import { THEME_OPTIONS, type ThemeType } from './theme'

const ICONS: Record<ThemeType, React.ComponentType<{ className?: string }>> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
}

/** Segmented System / Light / Dark control, bound to the theme preference. */
export function ThemeControl() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <p className="text-sm font-medium text-fg">Theme</p>
      <p className="mt-0.5 text-xs text-fg-subtle">“System” follows your device appearance.</p>

      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface-muted p-1">
        {THEME_OPTIONS.map(({ value, label }) => {
          const Icon = ICONS[value]
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-surface text-fg shadow-sm ring-1 ring-inset ring-border-strong'
                  : 'text-fg-subtle hover:text-fg'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
