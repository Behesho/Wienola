import AddressGroup from './AddressGroup'
import SlipUpload from './SlipUpload'
import type { AddressValue } from './types'
import './RouteStep.css'

interface RouteStepProps {
  pickup: AddressValue
  destination: AddressValue
  /** Defaults to "Transportstrecke". */
  heading?: string
  /** Set for Brief/Post orders: shows the Abholschein upload. */
  showSlip?: boolean
  slipVariant?: 'post' | 'willhaben' | 'billa'
  slip?: string | null
  /** Set for guests: they have no profile yet, so ask for contact details here. */
  showContact?: boolean
  guestName?: string
  guestEmail?: string
  contactPhone?: string
  returnTrip?: boolean
  onChange: (patch: {
    pickup?: AddressValue
    destination?: AddressValue
    slip?: string | null
    guestName?: string
    guestEmail?: string
    contactPhone?: string
    returnTrip?: boolean
  }) => void
}

function RouteStep({
  pickup,
  destination,
  heading = 'Transportstrecke',
  showSlip = false,
  slipVariant = 'post',
  slip = null,
  showContact = false,
  guestName = '',
  guestEmail = '',
  contactPhone = '',
  returnTrip = false,
  onChange,
}: RouteStepProps) {
  return (
    <div className="route-step">
      <h2 className="order-step__heading">{heading}</h2>

      {showContact && (
        <div className="route-step__contact">
          <h3 className="address-group__heading">Deine Kontaktdaten</h3>

          <label className="route-step__field">
            <span>Name</span>
            <input
              type="text"
              autoComplete="name"
              placeholder="Max Mustermann"
              value={guestName}
              onChange={(event) => onChange({ guestName: event.target.value })}
            />
          </label>

          <label className="route-step__field">
            <span>Telefonnummer</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+43 660 1234567"
              value={contactPhone}
              onChange={(event) => onChange({ contactPhone: event.target.value })}
            />
          </label>

          <label className="route-step__field">
            <span>E-Mail-Adresse</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@beispiel.at"
              value={guestEmail}
              onChange={(event) => onChange({ guestEmail: event.target.value })}
            />
          </label>
        </div>
      )}

      <AddressGroup
        heading="Abholung"
        value={pickup}
        onChange={(value) => onChange({ pickup: value })}
      />

      <AddressGroup
        heading="Ziel"
        value={destination}
        onChange={(value) => onChange({ destination: value })}
      />

      <div className="route-step__return">
        <span className="route-step__return-title">Gibt es einen Rückweg?</span>
        <span className="route-step__return-hint">
          Der Fahrer fährt nach der Zustellung zurück zur Abholadresse.
        </span>
        <div className="route-step__return-options">
          <button
            type="button"
            className={`route-step__return-option${!returnTrip ? ' route-step__return-option--selected' : ''}`}
            aria-pressed={!returnTrip}
            onClick={() => onChange({ returnTrip: false })}
          >
            Nein
          </button>
          <button
            type="button"
            className={`route-step__return-option${returnTrip ? ' route-step__return-option--selected' : ''}`}
            aria-pressed={returnTrip}
            onClick={() => onChange({ returnTrip: true })}
          >
            Ja
          </button>
        </div>
      </div>

      {showSlip && (
        <SlipUpload
          slip={slip}
          variant={slipVariant}
          onChange={(value) => onChange({ slip: value })} />
      )}
    </div>
  )
}

export default RouteStep
