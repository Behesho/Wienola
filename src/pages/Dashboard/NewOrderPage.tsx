import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from './NewOrder/icons'
import PhotoStep from './NewOrder/PhotoStep'
import DimensionsStep from './NewOrder/DimensionsStep'
import DetailsStep from './NewOrder/DetailsStep'
import VehicleStep from './NewOrder/VehicleStep'
import RouteStep from './NewOrder/RouteStep'
import ScheduleStep from './NewOrder/ScheduleStep'
import SuccessScreen from './NewOrder/SuccessScreen'
import { INITIAL_ORDER_DATA, STEP_TITLES, type OrderFormData } from './NewOrder/types'
import './NewOrderPage.css'

function validateStep(step: number, data: OrderFormData): string | null {
  switch (step) {
    case 2:
      return data.description.trim()
        ? null
        : 'Bitte beschreibe, was transportiert werden soll.'
    case 3:
      return data.vehicle ? null : 'Bitte wähle ein Fahrzeug aus.'
    case 4:
      return data.pickup.trim() && data.destination.trim()
        ? null
        : 'Bitte gib Abhol- und Zieladresse ein.'
    case 5:
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
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OrderFormData>(INITIAL_ORDER_DATA)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const lastStep = STEP_TITLES.length - 1
  const isLastStep = step === lastStep

  function update(patch: Partial<OrderFormData>) {
    setData((prev) => ({ ...prev, ...patch }))
  }

  function handleBack() {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  function handleNext() {
    const validationError = validateStep(step, data)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    if (isLastStep) {
      setSubmitted(true)
    } else {
      setStep((current) => current + 1)
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <PhotoStep photo={data.photo} onChange={(photo) => update({ photo })} />
        )
      case 1:
        return (
          <DimensionsStep
            length={data.length}
            width={data.width}
            height={data.height}
            onChange={update}
          />
        )
      case 2:
        return (
          <DetailsStep
            description={data.description}
            onChange={(description) => update({ description })}
          />
        )
      case 3:
        return (
          <VehicleStep
            vehicle={data.vehicle}
            onChange={(vehicle) => update({ vehicle })}
          />
        )
      case 4:
        return (
          <RouteStep
            pickup={data.pickup}
            destination={data.destination}
            onChange={update}
          />
        )
      case 5:
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
          disabled={step === 0}
          aria-label="Zurück"
        >
          <ChevronLeftIcon />
        </button>

        <div className="new-order-page__progress">
          <div className="new-order-page__progress-track">
            <div
              className="new-order-page__progress-fill"
              style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
            />
          </div>
          <span className="new-order-page__progress-label">
            Schritt {step + 1} von {STEP_TITLES.length} · {STEP_TITLES[step]}
          </span>
        </div>
      </div>

      <div className="new-order-page__step" key={step}>
        {renderStep()}
      </div>

      <div className="new-order-page__footer">
        {error && <p className="new-order-page__error">{error}</p>}
        <button
          type="button"
          className="new-order-page__submit"
          onClick={handleNext}
        >
          {isLastStep ? 'Auftrag veröffentlichen' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}

export default NewOrderPage
