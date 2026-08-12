import SelectField from '../../../components/SelectField/SelectField'
import { FLOOR_OPTIONS } from './districts'
import type { ElevatorAnswer } from './types'
import './MovingDetailsStep.css'

interface MovingDetailsStepProps {
  pickupFloor: string
  pickupElevator: ElevatorAnswer
  destinationFloor: string
  destinationElevator: ElevatorAnswer
  onChange: (patch: {
    pickupFloor?: string
    pickupElevator?: ElevatorAnswer
    destinationFloor?: string
    destinationElevator?: ElevatorAnswer
  }) => void
}

function ElevatorToggle({
  value,
  onChange,
}: {
  value: ElevatorAnswer
  onChange: (value: ElevatorAnswer) => void
}) {
  return (
    <div className="elevator-toggle">
      <button
        type="button"
        className={`elevator-toggle__option${value === 'yes' ? ' elevator-toggle__option--selected' : ''}`}
        aria-pressed={value === 'yes'}
        onClick={() => onChange('yes')}
      >
        Ja
      </button>
      <button
        type="button"
        className={`elevator-toggle__option${value === 'no' ? ' elevator-toggle__option--selected' : ''}`}
        aria-pressed={value === 'no'}
        onClick={() => onChange('no')}
      >
        Nein
      </button>
    </div>
  )
}

function MovingDetailsStep({
  pickupFloor,
  pickupElevator,
  destinationFloor,
  destinationElevator,
  onChange,
}: MovingDetailsStepProps) {
  return (
    <div className="moving-details-step">
      <h2 className="order-step__heading">Angaben zum Umzug</h2>

      <div className="moving-details-step__group">
        <SelectField
          label="Von welcher Etage?"
          placeholder="Etage wählen"
          value={pickupFloor}
          onChange={(pickupFloor) => onChange({ pickupFloor })}
        >
          {FLOOR_OPTIONS.map((floor) => (
            <option key={floor} value={floor}>
              {floor}
            </option>
          ))}
        </SelectField>

        <div className="moving-details-step__field">
          <span>Aufzug vorhanden?</span>
          <ElevatorToggle
            value={pickupElevator}
            onChange={(pickupElevator) => onChange({ pickupElevator })}
          />
        </div>
      </div>

      <div className="moving-details-step__group">
        <SelectField
          label="In welche Etage?"
          placeholder="Etage wählen"
          value={destinationFloor}
          onChange={(destinationFloor) => onChange({ destinationFloor })}
        >
          {FLOOR_OPTIONS.map((floor) => (
            <option key={floor} value={floor}>
              {floor}
            </option>
          ))}
        </SelectField>

        <div className="moving-details-step__field">
          <span>Aufzug vorhanden?</span>
          <ElevatorToggle
            value={destinationElevator}
            onChange={(destinationElevator) =>
              onChange({ destinationElevator })
            }
          />
        </div>
      </div>
    </div>
  )
}

export default MovingDetailsStep
