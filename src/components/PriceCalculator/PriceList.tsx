import { useState } from 'react'
import SelectField from '../SelectField/SelectField'
import { legPrice, ZONE_OPTIONS } from '../../lib/pricing'
import './PriceList.css'

/** Price list: pick a start zone and see the price to every other zone. */
function PriceList() {
  const [from, setFrom] = useState('1')

  return (
    <div className="price-list">
      <SelectField
        label="Abholung in"
        placeholder="Bezirk wählen"
        value={from}
        onChange={setFrom}
      >
        {ZONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <ul className="price-list__grid">
        {ZONE_OPTIONS.map((option) => {
          const price = legPrice(from, option.value)
          return (
            <li
              key={option.value}
              className={`price-list__item${option.value === from ? ' price-list__item--same' : ''}`}
            >
              <span className="price-list__zone">{option.label}</span>
              <span className="price-list__price">
                {price === null ? '–' : `€ ${price}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PriceList
