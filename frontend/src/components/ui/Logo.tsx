/**
 * App mark: the same barbell badge as `public/favicon.svg`, but using the
 * semantic `fg`/`surface` tokens so it inverts (black-on-white ↔ white-on-dark)
 * with the active theme instead of staying the fixed black/white of the favicon.
 */
export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" className="fill-fg" />
      <g
        fill="none"
        className="stroke-surface"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 16h10" />
        <path d="M8 11.5v9" />
        <path d="M11 9.5v13" />
        <path d="M21 9.5v13" />
        <path d="M24 11.5v9" />
      </g>
    </svg>
  )
}
