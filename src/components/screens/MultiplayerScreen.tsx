import { useState } from 'react'
import type { OAuthProvider } from '@shared'
import type { SectorType } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'

export default function MultiplayerScreen() {
  const {
    status: authStatus,
    profile,
    availableProviders,
    message: authMessage,
    setupError,
    startLogin,
    completeSetup,
    logout,
  } = useAuthStore()
  const {
    backendHealth,
    leaderboard,
    queueState,
    status,
    message,
    refreshLeaderboard,
    joinQueue,
    leaveQueue,
  } = useMultiplayerStore()

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Multiplayer Foundation</h2>
            <p className="text-sm text-gray-500 mt-1">
              Player profiles are stored in Supabase and loaded after OAuth sign-in. The Fastify
              server verifies JWTs and handles queue, encounter, and matchmaking logic.
            </p>
          </div>
          <div className={`text-xs font-label uppercase tracking-wide-custom ${status === 'ready' ? 'text-accent-lime' : 'text-accent-yellow'}`}>
            {backendHealth?.status ?? 'offline'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
          <InfoCard label="Backend" value={backendHealth?.service ?? 'Not connected'} />
          <InfoCard label="Version" value={backendHealth?.version ?? 'Foundation pending'} />
          <InfoCard label="WebSocket" value={backendHealth?.websocketUrl ?? 'Unavailable'} />
        </div>

        {(message || authMessage) && (
          <p className="text-sm text-gray-400 mt-4">{message ?? authMessage}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-200">Account Status</h3>
            <p className="text-sm text-gray-500 mt-1">
              Sign in via OAuth to link your account and access ranked multiplayer. Clicking a
              provider will redirect you to authenticate and return you to the game.
            </p>
          </div>

          {authStatus === 'setup-required' ? (
            <UsernameSetupCard
              onSubmit={completeSetup}
              error={setupError}
            />
          ) : (
            <>
              <div className="rounded border border-white/5 bg-surface-dark p-4 space-y-3">
                <StatusRow label="Session" value={authStatus.toUpperCase()} />
                <StatusRow label="Runner Profile" value={profile?.runnerName ?? 'Anonymous'} />
                <StatusRow label="MMR" value={profile ? profile.mmr : 'Not ranked'} />
                <StatusRow label="Region" value={profile?.region ?? 'Local only'} />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-label uppercase tracking-wide-custom text-text-muted">
                  OAuth Providers
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableProviders.length === 0 ? (
                    <span className="text-sm text-gray-600">Backend unavailable</span>
                  ) : (
                    <>
                      {availableProviders.map((provider) => (
                        <button
                          key={provider}
                          onClick={() => startLogin(provider)}
                          className="btn btn-secondary"
                        >
                          {formatProvider(provider)}
                        </button>
                      ))}
                      {authStatus === 'authenticated' && (
                        <button onClick={() => logout()} className="btn btn-secondary">
                          Logout
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-200">Leaderboard Preview</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sample ranked data from the Fastify foundation endpoint.
              </p>
            </div>
            <button onClick={() => refreshLeaderboard('global')} className="btn btn-secondary">
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            {leaderboard?.entries.length ? (
              leaderboard.entries.map((entry, index) => (
                <div key={entry.playerId} className="flex items-center justify-between rounded bg-surface-dark p-3 text-sm">
                  <div>
                    <div className="text-gray-200">
                      #{index + 1} {entry.runnerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.tier} · {entry.wins} wins · {entry.encounters} encounters
                    </div>
                  </div>
                  <div className="font-mono text-accent-yellow">{entry.mmr}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No leaderboard data loaded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-200">Queue Status</h3>
            <p className="text-sm text-gray-500 mt-1">
              Use the Deployment screen to queue for a multiplayer run. Authenticated runners within ±300 MMR and the same sector will be matched.
            </p>
          </div>
          <div className="text-xs font-label uppercase tracking-wide-custom text-accent-yellow">
            {queueState?.status ?? 'IDLE'}
          </div>
        </div>

        <div className="rounded border border-white/5 bg-surface-dark p-4 space-y-3">
          <StatusRow label="Queue ID" value={queueState?.queueId ?? 'Not queued'} />
          <StatusRow label="Sector" value={queueState?.sector ?? 'N/A'} />
          <StatusRow label="Status" value={queueState?.status ?? 'idle'} />
          {queueState?.status === 'matched' && (
            <StatusRow label="Run Session" value={queueState.runSessionId ?? 'N/A'} />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['residential', 'industrial', 'research'] as SectorType[]).map((sector) => (
            <button
              key={sector}
              onClick={() => joinQueue(sector)}
              className="btn btn-secondary"
              disabled={authStatus !== 'authenticated'}
            >
              Queue {sector}
            </button>
          ))}
          <button
            onClick={() => leaveQueue()}
            className="btn btn-secondary"
            disabled={authStatus !== 'authenticated'}
          >
            Leave Queue
          </button>
        </div>
        <p className="text-xs text-gray-600">Tip: Enable <span className="text-gray-400">Multiplayer mode</span> on the Deployment screen to queue when you deploy.</p>
      </div>
    </div>
  )
}

function UsernameSetupCard({
  onSubmit,
  error,
}: {
  onSubmit: (username: string) => Promise<void>
  error: string | null
}) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validationError =
    value.length > 0 && value.length < 3
      ? 'At least 3 characters required.'
      : value.length > 20
        ? 'Maximum 20 characters.'
        : value.length > 0 && !/^[a-zA-Z0-9_]+$/.test(value)
          ? 'Letters, numbers, and underscores only.'
          : null

  const canSubmit = value.length >= 3 && !validationError && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await onSubmit(value)
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded border border-accent-yellow/30 bg-surface-dark p-4 space-y-1">
        <p className="text-sm font-semibold text-accent-yellow">Choose your runner name</p>
        <p className="text-xs text-gray-500">
          3–20 characters · letters, numbers, and underscores · shown on leaderboards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Atlas_7"
            maxLength={20}
            className="w-full rounded border border-white/10 bg-surface-dark px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-yellow/50"
            autoFocus
          />
          {validationError && (
            <p className="mt-1 text-xs text-red-400">{validationError}</p>
          )}
          {error && !validationError && (
            <p className="mt-1 text-xs text-red-400">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating…' : 'Confirm name'}
        </button>
      </form>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-white/5 bg-surface-dark p-3">
      <div className="text-xs uppercase tracking-wide-custom text-text-muted">{label}</div>
      <div className="mt-1 text-sm text-text-primary break-all">{value}</div>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  )
}

function formatProvider(provider: OAuthProvider) {
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}
