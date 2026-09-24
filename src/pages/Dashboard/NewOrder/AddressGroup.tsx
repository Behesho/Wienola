import SelectField from '../../../components/SelectField/SelectField'
import { VIENNA_DISTRICTS, VIENNA_SURROUNDINGS } from './districts'
import type { AddressValue } from './types'
import './RouteStep.css'

interface AddressGroupProps {
  heading: string
  value: AddressValue
  onChange: (value: AddressValue) => void
}

function AddressGroup({ heading, value, onChange }: AddressGroupProps) {
  function patch(fields: Partial<AddressValue>) {
    onChange({ ...value, ...fields })
  }

  return (
    <div className="address-group">
      <h3 className="address-group__heading">{heading}</h3>

      <SelectField
        label="Bezirk / Umgebung"
        placeholder="Bitte wählen"
        value={value.district}
        onChange={(district) => patch({ district })}
      >
        <optgroup label="Wien">
          {VIENNA_DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </optgroup>
        <optgroup label="Wien Umgebung">
          {VIENNA_SURROUNDINGS.map((place) => (
            <option key={place} value={place}>
              {place}
            </option>
          ))}
        </optgroup>
        <option value="other">Anderer Ort</option>
      </SelectField>

      {value.district === 'other' && (
        <label className="route-step__field">
          <span>Ort</span>
          <input
            type="text"
            placeholder="Ort eingeben"
            value={value.customLocation}
            onChange={(event) =>
              patch({ customLocation: event.target.value })
            }
          />
        </label>
      )}

      <div className="address-group__row">
        <label className="route-step__field address-group__street">
          <span>Straße</span>
          <input
            type="text"
            placeholder="z. B. Hauptstraße"
            value={value.street}
            onChange={(event) => patch({ street: event.target.value })}
          />
        </label>

        <label className="route-step__field address-group__number">
          <span>Hausnummer</span>
          <input
            type="text"
            placeholder="12"
            value={value.houseNumber}
            onChange={(event) => patch({ houseNumber: event.target.value })}
          />
        </label>
      </div>

      <div className="address-group__row">
        <label className="route-step__field">
          <span>Stock (optional)</span>
          <input
            type="text"
            placeholder="z. B. 3"
            value={value.stock}
            onChange={(event) => patch({ stock: event.target.value })}
          />
        </label>

        <label className="route-step__field">
          <span>Wohnung / Tür (optional)</span>
          <input
            type="text"
            placeholder="z. B. 12"
            value={value.unit}
            onChange={(event) => patch({ unit: event.target.value })}
          />
        </label>
      </div>
    </div>
  )
}

export default AddressGroup
