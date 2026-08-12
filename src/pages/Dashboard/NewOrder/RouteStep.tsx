import AddressGroup from './AddressGroup'
import type { AddressValue } from './types'
import './RouteStep.css'

interface RouteStepProps {
  pickup: AddressValue
  destination: AddressValue
  onChange: (patch: {
    pickup?: AddressValue
    destination?: AddressValue
  }) => void
}

function RouteStep({ pickup, destination, onChange }: RouteStepProps) {
  return (
    <div className="route-step">
      <h2 className="order-step__heading">Transportstrecke</h2>

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
    </div>
  )
}

export default RouteStep
