import { useState, useEffect, useCallback } from 'react'
import type { OAuthProvider } from '@shared'
import type { SectorType } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { updateRunnerName, getFriends, sendFriendRequest, acceptFriend, removeFriend } from '@/lib/multiplayerApi'
import type { FriendEntry } from '@/lib/multiplayerApi'
import { notify } from '@/store/notificationStore'

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
    initializeAuth,
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

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setNameSaving(true)
    setNameError(null)
    try {
      const result = await updateRunnerName(trimmed)
      if (result.ok) {
        notify.success('Profile Updated', result.message)
        setEditingName(false)
        void initializeAuth() // refresh profile in authStore
      } else {
        setNameError(result.message)
      }
    } catch {
      setNameError('Failed to save. Try again.')
    } finally {
      setNameSaving(false)
    }
  }

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
                {/* Runner name with inline edit */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 shrink-0">Runner Profile</span>
                  {editingName ? (
                    <div className="flex items-center gap-1 ml-2 flex-1 min-w-0">
                      <input
                        className="bg-surface-raised border border-gray-700 rounded px-2 py-0.5 text-sm text-gray-200 w-full min-w-0"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                        autoFocus
                        maxLength={20}
                      />
                      <button
                        onClick={() => void handleSaveName()}
                        disabled={nameSaving}
                        className="btn-primary text-xs px-2 py-0.5 shrink-0"
                      >
                        {nameSaving ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingName(false); setNameError(null) }}
                        className="text-gray-500 hover:text-gray-300 text-xs px-1 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">{profile?.runnerName ?? 'Anonymous'}</span>
                      {profile && (
                        <button
                          onClick={() => { setNameInput(profile.runnerName ?? ''); setEditingName(true) }}
                          className="text-xs text-gray-600 hover:text-gray-400"
                          title="Edit runner name"
                        >
                          ✏
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {nameError && <p className="text-xs text-danger-400">{nameError}</p>}
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

      <FriendsPanel isAuthenticated={authStatus === 'authenticated'} myId={profile?.id} />

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

function FriendsPanel({ isAuthenticated, myId }: { isAuthenticated: boolean; myId?: string }) {
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  const loadFriends = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const result = await getFriends()
      setFriends(result.friends)
    } catch {
      // silently fail — not critical
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void loadFriends()
  }, [loadFriends])

  async function handleAdd() {
    const name = addInput.trim()
    if (!name) return
    setAddLoading(true)
    setAddError(null)
    try {
      const result = await sendFriendRequest(name)
      if (result.ok) {
        notify.success('Friend Request Sent', result.message)
        setAddInput('')
        void loadFriends()
      } else {
        setAddError(result.message)
      }
    } catch {
      setAddError('Request failed. Try again.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleAccept(friendId: string) {
    // We stored the friendship row id as the entry id for pending-received
    try {
      const result = await acceptFriend(friendId)
      if (result.ok) {
        notify.success('Friend Added', result.message)
        void loadFriends()
      }
    } catch { /* ignore */ }
  }

  async function handleRemove(friendId: string, name: string) {
    try {
      const result = await removeFriend(friendId)
      if (result.ok) {
        notify.info('Removed', `${name} removed from friends.`)
        void loadFriends()
      }
    } catch { /* ignore */ }
  }

  const accepted = friends.filter((f) => f.status === 'accepted')
  const pendingReceived = friends.filter((f) => f.status === 'pending' && f.direction === 'received')
  const pendingSent = friends.filter((f) => f.status === 'pending' && f.direction === 'sent')

  if (!isAuthenticated) {
    return (
      <div className="card space-y-3">
        <h3 className="text-base font-semibold text-gray-200">Friends</h3>
        <p className="text-sm text-gray-600">Sign in to add friends and see their rankings.</p>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-200">
          Friends
          {accepted.length > 0 && <span className="ml-2 text-sm text-gray-500">({accepted.length})</span>}
        </h3>
        <button onClick={() => void loadFriends()} className="btn btn-secondary text-xs" disabled={loading}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>

      {/* Add friend */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface-raised border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500"
          placeholder="Runner name…"
          value={addInput}
          maxLength={20}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd() }}
        />
        <button onClick={() => void handleAdd()} disabled={addLoading || !addInput.trim()} className="btn btn-secondary text-xs shrink-0">
          {addLoading ? '…' : 'Add Friend'}
        </button>
      </div>
      {addError && <p className="text-xs text-danger-400">{addError}</p>}

      {/* Pending incoming requests */}
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-label uppercase tracking-wide-custom text-accent-yellow">Pending Requests</p>
          {pendingReceived.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded bg-surface-dark p-2.5 text-sm">
              <span className="text-gray-200">{f.runnerName}</span>
              <div className="flex gap-1">
                <button onClick={() => void handleAccept(f.id)} className="btn btn-secondary text-xs">Accept</button>
                <button onClick={() => void handleRemove(f.id, f.runnerName)} className="text-gray-600 hover:text-gray-400 text-xs px-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accepted friends */}
      {accepted.length > 0 ? (
        <div className="space-y-2">
          {accepted.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded bg-surface-dark p-2.5 text-sm">
              <div>
                <span className="text-gray-200">{f.runnerName}</span>
                {f.id !== myId && (
                  <span className="ml-2 text-xs text-gray-600 font-mono">{f.mmr} MMR</span>
                )}
              </div>
              <button
                onClick={() => void handleRemove(f.id, f.runnerName)}
                className="text-gray-700 hover:text-gray-400 text-xs px-1"
                title="Remove friend"
              >✕</button>
            </div>
          ))}
        </div>
      ) : pendingReceived.length === 0 && (
        <p className="text-sm text-gray-600">No friends yet. Search by runner name above.</p>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">Sent requests: {pendingSent.map((f) => f.runnerName).join(', ')}</p>
        </div>
      )}
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
