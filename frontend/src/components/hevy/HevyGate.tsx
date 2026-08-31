import { useHevy } from './HevyProvider'
import { ConnectHevyScreen } from './ConnectHevyScreen'

/** Renders children only once Hevy is connected; otherwise the connect screen. */
export function HevyGate({ children }: { children: React.ReactNode }) {
  const { status } = useHevy()
  return status === 'connected' ? <>{children}</> : <ConnectHevyScreen />
}
