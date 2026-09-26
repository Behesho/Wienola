import AddressGroup from './AddressGroup'
import SlipUpload from './SlipUpload'
import type { AddressValue } from './types'
import './RouteStep.css'

interface RouteStepProps {
  pickup: AddressValue
  destination: AddressValue
  /** Set for Brief/Post orders: shows the Abholschein upload. */
  showSlip?: boolean
  slipVariant?: 'post' | 'willhaben'
  slip?: string | null
  onChange: (patch: {
    pickup?: AddressValue
    destination?: AddressValue
    slip?: string | null
  }) => void
}

function RouteStep({
  pickup,
  destination,
  showSlip = false,
  slipVariant = 'post',
  slip = null,
  onChange,
}: RouteStepProps) {
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
