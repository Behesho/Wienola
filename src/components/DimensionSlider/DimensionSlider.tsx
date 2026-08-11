import { useId, type ChangeEvent, type CSSProperties } from 'react'
import './DimensionSlider.css'

interface DimensionSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function DimensionSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: DimensionSliderProps) {
  const inputId = useId()
  const progress = ((value - min) / (max - min)) * 100

  function handleRangeChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value))
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    if (raw === '') return
    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed, min, max))
    }
  }

  function adjust(direction: 1 | -1) {
    onChange(clamp(value + direction * step, min, max))
  }

  return (
    <div className="dimension-slider">
      <div className="dimension-slider__header">
        <label htmlFor={inputId} className="dimension-slider__label">
          {label}
        </label>
        <div className="dimension-slider__value">
          <input
            id={inputId}
            type="number"
            className="dimension-slider__value-input"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={handleNumberChange}
          />
          <span className="dimension-slider__unit">cm</span>
        </div>
      </div>

      <div className="dimension-slider__control">
        <button
          type="button"
          className="dimension-slider__step-btn"
          onClick={() => adjust(-1)}
          aria-label={`${label} verringern`}
        >
          −
        </button>

        <input
          type="range"
          className="dimension-slider__range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleRangeChange}
          style={{ '--range-progress': `${progress}%` } as CSSProperties}
          aria-label={label}
        />

        <button
          type="button"
          className="dimension-slider__step-btn"
          onClick={() => adjust(1)}
          aria-label={`${label} erhöhen`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default DimensionSlider
