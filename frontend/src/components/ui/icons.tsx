/**
 * Shared inline icons (Feather-style, 24×24, `currentColor` stroke).
 * Every icon takes a `className` (default `h-4 w-4`) so callers control size and colour.
 */

interface IconProps {
  className?: string
}

const DEFAULT = 'h-4 w-4'

function svgProps(className: string) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
}

export function CheckIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function XIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function ChevronDownIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function WarningTriangleIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function EyeIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M10.73 10.73a3 3 0 0 0 4.24 4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export function CopyIcon({ className = DEFAULT }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
