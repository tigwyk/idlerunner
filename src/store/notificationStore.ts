import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'achievement'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // ms, default 4000
}

interface NotificationStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  clearAll: () => void
}

const MAX_TOASTS = 4

export const useNotificationStore = create<NotificationStore>()((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({
      toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), { ...toast, id }],
    }))
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearAll: () => set({ toasts: [] }),
}))

/** Convenience helpers so callers don't need to import the whole store */
export const notify = {
  success: (title: string, message?: string) =>
    useNotificationStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useNotificationStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useNotificationStore.getState().addToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useNotificationStore.getState().addToast({ type: 'warning', title, message }),
  achievement: (title: string, message?: string) =>
    useNotificationStore.getState().addToast({ type: 'achievement', title, message, duration: 6000 }),
}
