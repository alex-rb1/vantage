import { useEffect, useState } from 'react'
import { fetchHealth, type HealthResponse } from './health'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'loaded'; health: HealthResponse }
  | { kind: 'error'; message: string }

function App() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    // Aborting on cleanup prevents a stale request from updating state after
    // unmount (React StrictMode mounts effects twice in development).
    const controller = new AbortController()

    fetchHealth(controller.signal)
      .then((health) => setState({ kind: 'loaded', health }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        setState({ kind: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>Vantage</h1>
      <h2>Backend status</h2>
      <HealthStatus state={state} />
    </main>
  )
}

function HealthStatus({ state }: { state: HealthState }) {
  switch (state.kind) {
    case 'loading':
      return <p>Checking backend…</p>
    case 'error':
      return (
        <p role="alert">
          Could not reach the backend: {state.message}
        </p>
      )
    case 'loaded': {
      const { status, components = {} } = state.health
      return (
        <>
          <p>
            Backend is <strong>{status}</strong>
          </p>
          <ul>
            {Object.entries(components).map(([name, component]) => (
              <li key={name}>
                {name}: {component.status}
              </li>
            ))}
          </ul>
        </>
      )
    }
  }
}

export default App
