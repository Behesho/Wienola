import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import {
  fetchDrivers,
  insertExternalOrder,
  type DriverOption,
} from '../../../lib/orders'
import { parseOrderEmail, type ParsedOrderEmail } from '../../../lib/parseOrderEmail'
import { VIENNA_DISTRICTS } from '../NewOrder/districts'
import { EMPTY_ADDRESS, type AddressValue } from '../NewOrder/types'
import { PAYER_LABELS } from '../../../types/order'
import '../NewOrder/RouteStep.css'
import './ImportOrderPage.css'

function AddressFields({
  title,
  value,
  onChange,
}: {
  title: string
  value: AddressValue
  onChange: (value: AddressValue) => void
}) {
  const patch = (fields: Partial<AddressValue>) => onChange({ ...value, ...fields })
  return (
    <div className="import-order__group">
      <h3 className="import-order__heading">{title}</h3>
      <label className="route-step__field">
        <span>Bezirk</span>
        <select
          className="select-field__control"
          value={value.district}
          onChange={(event) => patch({ district: event.target.value })}
        >
          <option value="">Bitte wählen</option>
          {VIENNA_DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>
      <div className="address-group__row">
        <label className="route-step__field address-group__street">
          <span>Straße</span>
          <input
            type="text"
            value={value.street}
            onChange={(event) => patch({ street: event.target.value })}
          />
        </label>
        <label className="route-step__field address-group__number">
          <span>Hausnr.</span>
          <input
            type="text"
            value={value.houseNumber}
            onChange={(event) => patch({ houseNumber: event.target.value })}
          />
        </label>
      </div>
    </div>
  )
}

type PayerValue = '' | 'pickup' | 'destination' | 'cash' | 'card'

function ImportOrderPage() {
  const { user, profile } = useAuth()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedOrderEmail | null>(null)
  const [pickup, setPickup] = useState<AddressValue>({ ...EMPTY_ADDRESS })
  const [destination, setDestination] = useState<AddressValue>({ ...EMPTY_ADDRESS })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState<PayerValue>('')
  const [express, setExpress] = useState(true)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [driverId, setDriverId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(false)

  useEffect(() => {
    if (!profile?.is_admin) return
    let active = true
    fetchDrivers().then(({ data }) => {
      if (active) setDrivers(data ?? [])
    })
    return () => {
      active = false
    }
  }, [profile?.is_admin])

  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  function handleRead() {
    const result = parseOrderEmail(text)
    setParsed(result)
    setPickup(result.pickup)
    setDestination(result.destination)
    setName(result.name)
    setPhone(result.phone)
    setEmail(result.email)
    setAmount(result.amount)
    setPayer(result.payer)
    setExpress(result.express)
    setDate(result.date)
    setTime(result.time)
    setNotes(result.notes)
    setError('')
    setCreated(false)
  }

  function handleReset() {
    setText('')
    setParsed(null)
    setCreated(false)
    setError('')
    setDriverId('')
  }

  async function handleCreate() {
    if (!user) return
    if (!pickup.street.trim() || !destination.street.trim()) {
      setError('Bitte Abhol- und Zustelladresse ausfüllen.')
      return
    }
    if (!pickup.district || !destination.district) {
      setError('Bitte bei beiden Adressen den Bezirk wählen.')
      return
    }
    if (!phone.trim()) {
      setError('Bitte eine Telefonnummer eintragen, damit der Fahrer anrufen kann.')
      return
    }
    setError('')
    setSubmitting(true)
    const { error: insertError } = await insertExternalOrder(user.id, {
      transportType: 'courier',
      description: notes,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pickup,
      destination,
      express,
      date,
      time,
      payer: payer || null,
      amount,
      assignedDriverId: driverId || null,
    })
    setSubmitting(false)
    if (insertError) {
      console.error('Failed to import order:', insertError.message)
      setError('Der Auftrag konnte nicht erstellt werden. Bitte versuche es erneut.')
      return
    }
    setCreated(true)
    setParsed(null)
    setText('')
    setDriverId('')
  }

  return (
    <div className="import-order">
      <h1 className="import-order__title">Auftrag aus E-Mail</h1>

      {created && (
        <p className="import-order__done" role="status">
          Auftrag erstellt — die Fahrer sehen ihn jetzt unter „Neue Aufträge“.
        </p>
      )}

      {!parsed && (
        <>
          <p className="import-order__hint">
            Kopiere den Text der Bestell-E-Mail hierher. Die Angaben werden
            automatisch gelesen, du prüfst sie und erstellst den Auftrag.
          </p>
          <textarea
            className="import-order__text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="E-Mail-Text hier einfügen…"
            rows={10}
          />
          <button
            type="button"
            className="import-order__primary"
            onClick={handleRead}
            disabled={!text.trim()}
          >
            Auslesen
          </button>
        </>
      )}

      {parsed && (
        <>
          <p className="import-order__hint">
            Bitte prüfen und bei Bedarf korrigieren — leere Felder wurden im Text
            nicht gefunden.
          </p>

          <div className="import-order__group">
            <h3 className="import-order__heading">Kunde</h3>
            <label className="route-step__field">
              <span>Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="route-step__field">
              <span>Telefonnummer</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="route-step__field">
              <span>E-Mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <AddressFields title="Abholung" value={pickup} onChange={setPickup} />
          <AddressFields title="Zustellung" value={destination} onChange={setDestination} />

          <div className="import-order__group">
            <h3 className="import-order__heading">Termin &amp; Zahlung</h3>
            <label className="import-order__check">
              <input
                type="checkbox"
                checked={express}
                onChange={(e) => setExpress(e.target.checked)}
              />
              <span>So schnell wie möglich</span>
            </label>
            {!express && (
              <div className="address-group__row">
                <label className="route-step__field">
                  <span>Datum</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <label className="route-step__field">
                  <span>Uhrzeit</span>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </label>
              </div>
            )}
            <label className="route-step__field">
              <span>Preis (€)</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
              />
            </label>
            <label className="route-step__field">
              <span>Zahlungsart / Zahler</span>
              <select
                className="select-field__control"
                value={payer}
                onChange={(e) => setPayer(e.target.value as PayerValue)}
              >
                <option value="">Keine Angabe</option>
                {(['pickup', 'destination', 'cash', 'card'] as const).map((key) => (
                  <option key={key} value={key}>
                    {PAYER_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="route-step__field">
              <span>Hinweis für den Fahrer</span>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>

          <div className="import-order__group">
            <h3 className="import-order__heading">Senden an</h3>
            <label className="route-step__field">
              <span>Nur an diesen Dienstleister (optional)</span>
              <select
                className="select-field__control"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">An alle Dienstleister</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name || driver.phone || driver.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="import-order__error">{error}</p>}

          <button
            type="button"
            className="import-order__primary"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? 'Wird erstellt…' : 'Auftrag erstellen'}
          </button>
          <button type="button" className="import-order__secondary" onClick={handleReset}>
            Neu beginnen
          </button>
        </>
      )}

      <Link to="/dashboard/admin" className="import-order__back">
        ← Zurück zu „Aufträge zuweisen“
      </Link>
    </div>
  )
}

export default ImportOrderPage
