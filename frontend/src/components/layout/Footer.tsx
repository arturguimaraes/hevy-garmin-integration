const REPO_URL = 'https://github.com/arturguimaraes/hevy-garmin-integration'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 py-4 text-center text-xs text-gray-400">
      v{__APP_VERSION__} (
      <a
        href={`${REPO_URL}/commit/${__COMMIT_SHA__}`}
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-gray-600"
      >
        {__COMMIT_SHA__}
      </a>
      ) · {__BUILD_DATE__} {__BUILD_TIME__} UTC
    </footer>
  )
}
