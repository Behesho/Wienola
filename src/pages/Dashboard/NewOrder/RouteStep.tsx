import { PinIcon } from '../../../components/icons/NavIcons'
import './RouteStep.css'

interface RouteStepProps {
  pickup: string
  destination: string
  onChange: (patch: { pickup?: string; destination?: string }) => void
}

function RouteStep({ pickup, destination, onChange }: RouteStepProps) {
  return (
    <div className="route-step">
      <h2 className="order-step__heading">Transportstrecke</h2>

      <label className="route-step__field">
        <span>
          <PinIcon className="route-step__field-icon" />
          Abholung
        </span>
        <input
          type="text"
          placeholder="Abholadresse eingeben"
          value={pickup}
          onChange={(event) => onChange({ pickup: event.target.value })}
        />
      </label>

      <label className="route-step__field">
        <span>
          <PinIcon className="route-step__field-icon" />
          Ziel
        </span>
        <input
          type="text"
          placeholder="Zieladresse eingeben"
          value={destination}
          onChange={(event) => onChange({ destination: event.target.value })}
        />
      </label>
    </div>
  )
}

export default RouteStep
