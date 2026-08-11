import type { VehicleType } from './types'
import { BikeIcon, CarIcon, TruckIcon, VanIcon } from './icons'
import './VehicleStep.css'

interface VehicleStepProps {
  vehicle: VehicleType | null
  onChange: (vehicle: VehicleType) => void
}

const VEHICLES: { type: VehicleType; label: string; icon: typeof BikeIcon }[] = [
  { type: 'bike', label: 'Fahrrad', icon: BikeIcon },
  { type: 'car', label: 'PKW', icon: CarIcon },
  { type: 'van', label: 'Transporter', icon: VanIcon },
  { type: 'truck', label: 'LKW', icon: TruckIcon },
]

function VehicleStep({ vehicle, onChange }: VehicleStepProps) {
  return (
    <div className="vehicle-step">
      <h2 className="order-step__heading">
        Welches Fahrzeug benötigst du?
      </h2>

      <div className="vehicle-step__grid">
        {VEHICLES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            className={`vehicle-card${vehicle === type ? ' vehicle-card--selected' : ''}`}
            aria-pressed={vehicle === type}
            onClick={() => onChange(type)}
          >
            <Icon className="vehicle-card__icon" />
            <span className="vehicle-card__label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default VehicleStep
