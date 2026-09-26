import { useState } from 'react'
import SelectField from '../SelectField/SelectField'
import { computeQuote, ZONE_OPTIONS, zoneName } from '../../lib/pricing'
import { formatAmount } from '../../types/order'
import './PriceCalculator.css'

function ZoneOptions() {
  return (
    <>
      {ZONE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  )
}

function PriceCalculator() {
  const [pickup, setPickup] = useState('')
  const [delivery, setDelivery] = useState('')
  const [extraStop, setExtraStop] = useState('')
  const [returnTo, setReturnTo] = useState('')

  const quote = computeQuote({
    pickup,
    delivery,
    extraStop: extraStop === 'none' ? '' : extraStop,
    returnTo: returnTo === 'none' ? '' : returnTo,
  })

  function reset() {
    setPickup('')
    setDelivery('')
    setExtraStop('')
    setReturnTo('')
  }

  const hasInput = pickup || delivery || extraStop || returnTo

  return (
    <div className="price-calculator">
      <div className="price-calculator__fields">
        <SelectField
          label="Abholbezirk"
          placeholder="Bezirk wählen"
          value={pickup}
          onChange={setPickup}
        >
          <ZoneOptions />
        </SelectField>

        <SelectField
          label="Zustellbezirk"
          placeholder="Bezirk wählen"
          value={delivery}
          onChange={setDelivery}
        >
          <ZoneOptions />
        </SelectField>

        <SelectField
          label="Zusatzstopp (optional)"
          placeholder="Kein Zusatzstopp"
          value={extraStop}
          onChange={setExtraStop}
        >
          <option value="none">Kein Zusatzstopp</option>
          <ZoneOptions />
        </SelectField>

        <SelectField
          label="Rückweg (optional)"
          placeholder="Kein Rückweg"
          value={returnTo}
          onChange={setReturnTo}
        >
          <option value="none">Kein Rückweg</option>
          <option value="back">
            Zurück zum Abholbezirk
            {pickup ? ` (${zoneName(pickup)})` : ''}
          </option>
          <ZoneOptions />
        </SelectField>
      </div>

      <div className="price-calculator__result" aria-live="polite">
        {quote.total === null ? (
          <p className="price-calculator__hint">
            Wähle Abhol- und Zustellbezirk, um den Preis zu sehen.
          </p>
        ) : (
          <>
            <ul className="price-calculator__lines">
              {quote.lines.map((line) => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <span>{formatAmount(line.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="price-calculator__total">
              <span>Gesamtpreis</span>
              <strong>{formatAmount(quote.total)}</strong>
            </div>
          </>
        )}
      </div>

      <div className="price-calculator__footer">
        <span className="price-calculator__note">
          Preise für Fahrrad/Moped und PKW, inkl. USt.
        </span>
        <button
          type="button"
          className="price-calculator__reset"
          onClick={reset}
          disabled={!hasInput}
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  )
}

export default PriceCalculator
