import { Moon, Sun } from 'lucide-react'

const themeOptions = [
  { value: 'hud', label: '科技深色', icon: Moon },
  { value: 'cheerful', label: '輕鬆歡快', icon: Sun }
]

const AdminThemeSwitch = ({ theme, onChange, compact = false }) => (
  <div
    className={`admin-theme-switch ${compact ? 'is-compact' : ''}`}
    role="group"
    aria-label="管理介面風格"
  >
    {themeOptions.map((option) => {
      const active = theme === option.value

      return (
        <button
          key={option.value}
          type="button"
          className={active ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
          aria-pressed={active}
          title={option.label}
        >
          <option.icon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{option.label}</span>
        </button>
      )
    })}
  </div>
)

export default AdminThemeSwitch
