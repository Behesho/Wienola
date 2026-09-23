import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { insertOrder } from '../../lib/orders'
import { ChevronLeftIcon } from './NewOrder/icons'
import TransportTypeStep from './NewOrder/TransportTypeStep'
import PhotoStep from './NewOrder/PhotoStep'
import DimensionsStep from './NewOrder/DimensionsStep'
import MovingDetailsStep from './NewOrder/MovingDetailsStep'
import DetailsStep from './NewOrder/DetailsStep'
import VehicleStep from './NewOrder/VehicleStep'
import RouteStep from './NewOrder/RouteStep'
import ContactStep from './NewOrder/ContactStep'
import ScheduleStep from './NewOrder/ScheduleStep'
import SuccessScreen from './NewOrder/SuccessScreen'
import {
  getStepSequence,
  INITIAL_ORDER_DATA,
  isAddressComplete,
  STEP_LABELS,
  type OrderFormData,
  type StepKey,
} from './NewOrder/types'
import './NewOrderPage.css'

function validateStep(stepKey: StepKey, data: OrderFormData): string | null {
  switch (stepKey) {
    case 'type':
      return data.transportType ? null : 'Bitte wähle eine Auftragsart aus.'
    case 'moving':
      return data.pickupFloor &&
        data.pickupElevator &&
        data.destinationFloor &&
        data.destinationElevator
        ? null
        : 'Bitte gib Etage und Aufzug für Abholung und Ziel an.'
    case 'details':
      return data.description.trim()
        ? null
        : 'Bitte beschreibe, was transportiert werden soll.'
    case 'vehicle':
      return data.vehicle ? null : 'Bitte wähle ein Fahrzeug aus.'
    case 'route':
      return isAddressComplete(data.pickup) && isAddressComplete(data.destination)
        ? null
        : 'Bitte vervollständige Abholung und Ziel.'
    case 'contact': {
      if (!data.contactPhone.trim()) {
        return 'Bitte gib deine Telefonnummer ein.'
      }
      const parsedAmount = Number(data.amount)
      if (!data.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return 'Bitte gib einen gültigen Auftragsbetrag ein.'
      }
      return null
    }
    case 'schedule':
      if (data.express) return null
      return data.date && data.time
        ? null
        : 'Bitte wähle einen Termin oder „So schnell wie möglich“.'
    default:
      return null
  }
}

function NewOrderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [data, setData] = useState<OrderFormData>(INITIAL_ORDER_DATA)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const steps = getStepSequence(data.transportType)
  const currentStep = steps[stepIndex]
  // The type step is only "last" in the trivial (type not yet chosen) case —
  // it always leads to more steps once a transport type is selected.
  const isLastStep = currentStep !== 'type' && stepIndex === steps.length - 1

  function update(patch: Partial<OrderFormData>) {
    setData((prev) => ({ ...prev, ...patch }))
  }

  function handleBack() {
    setError(null)
    setStepIndex((current) => Math.max(0, current - 1))
  }

  async function handleNext() {
    const validationError = validateStep(currentStep, data)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    if (!isLastStep) {
      setStepIndex((current) => current + 1)
      return
    }

    if (!user) {
      setError('Bitte melde dich erneut an, um den Auftrag zu veröffentlichen.')
      return
    }

    setSubmitting(true)
    const { error: insertError } = await insertOrder(user.id, data)
    setSubmitting(false)

    if (insertError) {
      console.error('Failed to create order:', insertError.message)
      setError('Auftrag konnte nicht veröffentlicht werden. Bitte versuche es erneut.')
      return
    }

    setSubmitted(true)
  }

  function renderStep() {
    switch (currentStep) {
      case 'type':
        return (
          <TransportTypeStep
            transportType={data.transportType}
            onChange={(transportType) => update({ transportType })}
          />
        )
      case 'photo':
        return (
          <PhotoStep
            photo={data.photo}
            onChange={(photo) => update({ photo })}
          />
        )
      case 'dimensions':
        return (
          <DimensionsStep
            length={data.length}
            width={data.width}
            height={data.height}
            onChange={update}
          />
        )
      case 'moving':
        return (
          <MovingDetailsStep
            pickupFloor={data.pickupFloor}
            pickupElevator={data.pickupElevator}
            destinationFloor={data.destinationFloor}
            destinationElevator={data.destinationElevator}
            onChange={update}
          />
        )
      case 'details':
        return (
          <DetailsStep
            description={data.description}
            onChange={(description) => update({ description })}
          />
        )
      case 'vehicle':
        return (
          <VehicleStep
            vehicle={data.vehicle}
            onChange={(vehicle) => update({ vehicle })}
          />
        )
      case 'route':
        return (
          <RouteStep
            pickup={data.pickup}
            destination={data.destination}
            onChange={update}
          />
        )
      case 'contact':
        return (
          <ContactStep
            contactPhone={data.contactPhone}
            amount={data.amount}
            onChange={update}
          />
        )
      case 'schedule':
        return (
          <ScheduleStep
            date={data.date}
            time={data.time}
            express={data.express}
            onChange={update}
          />
        )
      default:
        return null
    }
  }

  if (submitted) {
    return (
      <div className="new-order-page">
        <SuccessScreen onViewOffers={() => navigate('/dashboard/orders')} />
      </div>
    )
  }

  return (
    <div className="new-order-page">
      <div className="new-order-page__header">
        <button
          type="button"
          className="new-order-page__back"
          onClick={handleBack}
          disabled={stepIndex === 0}
          aria-label="Zurück"
        >
          <ChevronLeftIcon />
        </button>

        <div className="new-order-page__progress">
          <div className="new-order-page__progress-track">
            <div
              className="new-order-page__progress-fill"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="new-order-page__progress-label">
            Schritt {stepIndex + 1} von {steps.length} ·{' '}
            {STEP_LABELS[currentStep]}
          </span>
        </div>
      </div>

      <div className="new-order-page__step" key={currentStep}>
        {renderStep()}
      </div>

      <div className="new-order-page__footer">
        {error && <p className="new-order-page__error">{error}</p>}
        <button
          type="button"
          className="new-order-page__submit"
          onClick={handleNext}
          disabled={submitting}
        >
          {submitting
            ? 'Wird veröffentlicht…'
            : isLastStep
              ? 'Auftrag veröffentlichen'
              : 'Weiter'}
        </button>
      </div>
    </div>
  )
}

export default NewOrderPage
