import { useEffect } from 'react'
import { useNotificationStore, type Toast } from '@/store/notificationStore'

const ICONS: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
  achievement: '🏆',
}

const COLORS: Record<Toast['type'], string> = {
  success: 'border-green-500 bg-green-950/80',
  error:   'border-red-500 bg-red-950/80',
  info:    'border-blue-500 bg-blue-950/80',
  warning: 'border-yellow-500 bg-yellow-950/80',
  achievement: 'border-accent-yellow bg-yellow-950/80',
}

const ICON_COLORS: Record<Toast['type'], string> = {
  success:     'text-green-400',
  error:       'text-red-400',
  info:        'text-blue-400',
  warning:     'text-yellow-400',
  achievement: 'text-accent-yellow',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useNotificationStore()
  const duration = toast.duration ?? 4000

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, dismissToast])

  return (
    <div
      className={`relative flex items-start gap-3 p-3 rounded border backdrop-blur-sm
        text-sm shadow-lg transition-all duration-300 animate-slide-in
        ${COLORS[toast.type]}`}
    >
      <span className={`text-base font-bold mt-0.5 shrink-0 ${ICON_COLORS[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-100 leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-gray-400 text-xs mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-gray-500 hover:text-gray-300 text-xs leading-none mt-0.5 shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export default function ToastStack() {
  const toasts = useNotificationStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
