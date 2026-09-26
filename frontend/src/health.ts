// Shape of Spring Boot Actuator's /actuator/health response. The backend is
// configured to include per-component statuses (e.g. "db"), but not details.
export interface HealthResponse {
  status: string
  components?: Record<string, { status: string }>
}

export async function fetchHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/actuator/health', { signal })

  // Actuator answers 503 with a normal JSON body when the app is DOWN, so a
  // non-2xx status can still carry a useful health report. Anything else
  // (e.g. the dev proxy failing because the backend isn't running) is an error.
  const isJson = response.headers.get('content-type')?.includes('json') ?? false
  if (!isJson) {
    throw new Error(`Unexpected response from backend (HTTP ${response.status})`)
  }
  return (await response.json()) as HealthResponse
}
