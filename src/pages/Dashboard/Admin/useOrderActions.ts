import { useState } from 'react'
import { useFeedback } from '../../../context/useFeedback'
import {
  assignOrder,
  deleteOrder,
  releaseOrder,
  setOrderStatus,
  type ActionResult,
  type DriverProfile,
} from '../../../lib/admin'
import { advanceOrderStatus, rejectOrder } from '../../../lib/orders'
import {
  STATUS_ADVANCE,
  STATUS_LABELS,
  type Order,
  type OrderStatus,
} from '../../../types/order'

/** The few fields every admin action needs. */
export type ActionOrder = Pick<Order, 'id' | 'status' | 'driver_id'>

const MISSING_TEXT = 'Dafür fehlt noch SQL (siehe Warnung oben).'

/** Every admin action on one order, each with its confirmation and toast. */
export function useOrderActions(
  order: ActionOrder,
  adminId: string,
  drivers: DriverProfile[],
  onChanged: () => void,
  afterDelete?: () => void,
) {
  const { confirm, toast } = useFeedback()
  const [busy, setBusy] = useState(false)

  const driverName = (id: string) =>
    drivers.find((driver) => driver.id === id)?.full_name || 'Fahrer'

  async function run(action: () => Promise<ActionResult>, okText: string, after?: () => void) {
    setBusy(true)
    const result = await action()
    setBusy(false)
    if (result.ok) {
      toast(okText)
      onChanged()
      after?.()
    } else {
      toast(result.missing ? MISSING_TEXT : 'Das war nicht möglich.', 'error')
    }
  }

  async function assign(driverId: string) {
    if (!driverId) return
    if (order.driver_id) {
      const ok = await confirm({
        message: `Auftrag an ${driverName(driverId)} übergeben?`,
        confirmLabel: 'Ja, übergeben',
      })
      if (!ok) return
    }
    await run(() => assignOrder(order, driverId), `Zugewiesen an ${driverName(driverId)}`)
  }

  async function selfAccept() {
    await run(() => assignOrder(order, adminId), 'Auftrag angenommen')
  }

  async function advance() {
    const step = STATUS_ADVANCE[order.status]
    if (!step || !order.driver_id) return
    if (step.next === 'delivered' || step.next === 'completed') {
      const ok = await confirm({
        message: `Auftrag als „${STATUS_LABELS[step.next]}“ melden?`,
        confirmLabel: 'Ja, melden',
      })
      if (!ok) return
    }
    const driverId = order.driver_id
    await run(async () => {
      const { data } = await advanceOrderStatus(order.id, driverId, step.next)
      return { ok: !!data }
    }, step.label)
  }

  async function release() {
    const ok = await confirm({
      message: 'Den Auftrag dem Fahrer wegnehmen? Er ist danach wieder frei.',
      confirmLabel: 'Ja, freigeben',
    })
    if (!ok) return
    await run(() => releaseOrder(order.id), 'Auftrag ist wieder frei')
  }

  async function cancel() {
    const ok = await confirm({
      message: 'Diesen Auftrag stornieren?',
      confirmLabel: 'Ja, stornieren',
      danger: true,
    })
    if (!ok) return
    await run(() => setOrderStatus(order.id, 'cancelled'), 'Auftrag storniert')
  }

  async function remove() {
    const ok = await confirm({
      title: 'Auftrag löschen',
      message: 'Der Auftrag wird endgültig gelöscht. Das kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Ja, löschen',
      danger: true,
    })
    if (!ok) return
    await run(() => deleteOrder(order.id), 'Auftrag gelöscht', afterDelete)
  }

  async function changeStatus(status: OrderStatus) {
    if (status === order.status) return
    if (status === 'cancelled') {
      await cancel()
      return
    }
    await run(() => setOrderStatus(order.id, status), `Status: ${STATUS_LABELS[status]}`)
  }

  async function reject() {
    setBusy(true)
    const { error } = await rejectOrder(order.id, adminId)
    setBusy(false)
    if (error) {
      toast('Ablehnen war nicht möglich.', 'error')
      return
    }
    toast('Auftrag abgelehnt')
    onChanged()
  }

  return { busy, assign, selfAccept, advance, release, cancel, remove, changeStatus, reject }
}
