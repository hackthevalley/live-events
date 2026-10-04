import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type ScheduleEvent = {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
}

type Schedule = {
  event_start_at: string
  event_end_at: string
  events: ScheduleEvent[]
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000').replace(/\/+$/, '')
const API_BASE_URL = `${BACKEND_URL}/api`
const timeFormatter = new Intl.DateTimeFormat('en-CA', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Toronto',
})
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  timeZone: 'America/Toronto',
})

function eventTime(event: ScheduleEvent) {
  return `${timeFormatter.format(new Date(event.starts_at))} – ${timeFormatter.format(new Date(event.ends_at))}`
}

function App() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSchedule = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`Schedule request failed (${response.status})`)
      setSchedule((await response.json()) as Schedule)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- initial remote data load
    void loadSchedule()
    const clock = window.setInterval(() => setNow(new Date()), 15_000)
    const refresh = window.setInterval(() => void loadSchedule(), 60_000)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(refresh)
    }
  }, [loadSchedule])

  const state = useMemo(() => {
    const timestamp = now.getTime()
    const events = schedule?.events ?? []
    const current = events.filter(
      (event) =>
        new Date(event.starts_at).getTime() <= timestamp &&
        timestamp < new Date(event.ends_at).getTime(),
    )
    const next = events.find((event) => new Date(event.starts_at).getTime() > timestamp) ?? null
    return { current, next }
  }, [now, schedule])

  const featured = state.current[0] ?? state.next
  const isLive = state.current.length > 0
  const eventHasEnded = schedule ? now >= new Date(schedule.event_end_at) : false
  const remainingEvents = schedule?.events
    .filter((event) => new Date(event.ends_at) > now && event.id !== featured?.id)
    .slice(0, 3) ?? []

  return (
    <main className="status-page">
      <header className="status-header">
        <span>Hack the Valley 11</span>
        <div className="header-date">
          <time dateTime={now.toISOString()}>{dateFormatter.format(now)}</time>
          <span>{timeFormatter.format(now)} ET</span>
        </div>
      </header>

      <section className="status-content" aria-live="polite">
        {loading ? (
          <>
            <p className="status-kicker">Live schedule</p>
            <h1 className="status-title pulse">Loading</h1>
            <p className="status-message">Finding out what’s happening now…</p>
          </>
        ) : error ? (
          <>
            <p className="status-kicker">Live schedule</p>
            <h1 className="status-title">Oops!</h1>
            <p className="status-message">We couldn’t load the schedule.</p>
            <p className="status-detail">{error}</p>
            <button className="status-button" type="button" onClick={() => void loadSchedule()}>
              Try Again
            </button>
          </>
        ) : featured ? (
          <>
            <p className={`status-kicker ${isLive ? 'is-live' : ''}`}>
              {isLive && <span className="live-dot" />}
              {isLive ? 'Happening now' : 'Up next'}
            </p>
            <h1 className="status-title event-title">{featured.title}</h1>
            <p className="status-message">
              {dateFormatter.format(new Date(featured.starts_at))}
              <br />
              {eventTime(featured)}
            </p>
            {(featured.location || featured.description) && (
              <div className="event-details">
                {featured.location && <p className="status-detail event-location">{featured.location}</p>}
                {featured.description && <p className="status-detail">{featured.description}</p>}
              </div>
            )}
            {state.current.length > 1 && (
              <p className="simultaneous">
                +{state.current.length - 1} more event{state.current.length > 2 ? 's' : ''} live
              </p>
            )}
          </>
        ) : (
          <>
            <p className="status-kicker">Live schedule</p>
            <h1 className="status-title">{eventHasEnded ? 'That’s a wrap!' : 'Stay tuned'}</h1>
            <p className="status-message">
              {eventHasEnded ? 'Hack the Valley 11 is complete.' : 'No event is scheduled yet.'}
            </p>
            <p className="status-detail">
              {eventHasEnded ? 'Thank you for building with us.' : 'Check back soon for live updates.'}
            </p>
          </>
        )}
      </section>

      {remainingEvents.length > 0 && (
        <aside className="upcoming" aria-labelledby="upcoming-title">
          <p id="upcoming-title">Coming up</p>
          <div className="upcoming-list">
            {remainingEvents.map((event) => (
              <article key={event.id}>
                <time dateTime={event.starts_at}>{timeFormatter.format(new Date(event.starts_at))}</time>
                <span>{event.title}</span>
              </article>
            ))}
          </div>
        </aside>
      )}
    </main>
  )
}

export default App
