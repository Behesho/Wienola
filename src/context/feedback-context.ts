import { createContext } from 'react'

export interface ConfirmOptions {
  title?: string
  message: string
  /** Specific label, e.g. "Ja, stornieren". */
  confirmLabel: string
  /** Red confirm button for destructive actions. */
  danger?: boolean
}

export type ToastTone = 'ok' | 'error'

export interface FeedbackContextValue {
  /** In-app confirmation dialog; nothing happens before the user confirms. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  toast: (message: string, tone?: ToastTone) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)
