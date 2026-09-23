import { getSoundEnabled } from './driverPreferences'
import { startRepeating, stopRepeating } from './notificationSound'

const ACK_EVENT = 'lasten-wien:orders-acknowledged'

/** A new open order arrived — start (or continue) the repeating chime. */
export function notifyNewOrder() {
  if (getSoundEnabled()) {
    startRepeating()
  }
}

/**
 * The driver took action on the new-order notification (accepted a job,
 * dismissed the banner, or opened it) — stop the sound and tell every
 * NewOrderNotification instance to clear its pending count.
 */
export function acknowledgeNewOrders() {
  stopRepeating()
  window.dispatchEvent(new Event(ACK_EVENT))
}

export function onOrdersAcknowledged(callback: () => void) {
  window.addEventListener(ACK_EVENT, callback)
  return () => window.removeEventListener(ACK_EVENT, callback)
}
