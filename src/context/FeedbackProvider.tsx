import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  FeedbackContext,
  type ConfirmOptions,
  type ToastTone,
} from './feedback-context'
import './FeedbackProvider.css'

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

/** In-app confirm dialog and toasts (used instead of window.confirm). */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve })
      }),
    [],
  )

  const toast = useCallback((message: string, tone: ToastTone = 'ok') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  function answer(confirmed: boolean) {
    pending?.resolve(confirmed)
    setPending(null)
  }

  useEffect(() => {
    if (!pending) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        pending?.resolve(false)
        setPending(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending])

  return (
    <FeedbackContext.Provider value={{ confirm, toast }}>
      {children}

      {pending && (
        <div className="confirm-dialog" role="alertdialog" aria-modal="true">
          <button
            type="button"
            className="confirm-dialog__backdrop"
            aria-label="Abbrechen"
            onClick={() => answer(false)}
          />
          <div className="confirm-dialog__card">
            {pending.title && <h2 className="confirm-dialog__title">{pending.title}</h2>}
            <p className="confirm-dialog__message">{pending.message}</p>
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="confirm-dialog__cancel"
                onClick={() => answer(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={`confirm-dialog__confirm${pending.danger ? ' confirm-dialog__confirm--danger' : ''}`}
                onClick={() => answer(true)}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone}`}>
            {item.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}
