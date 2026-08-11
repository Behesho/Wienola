import type { CSSProperties } from 'react'
import DimensionSlider from '../../../components/DimensionSlider/DimensionSlider'
import './DimensionsStep.css'

interface DimensionsStepProps {
  length: number
  width: number
  height: number
  onChange: (patch: { length?: number; width?: number; height?: number }) => void
}

const MIN_CM = 10
const MAX_CM = 250
const MIN_PX = 44
const MAX_PX = 132

function toPx(cm: number) {
  const ratio = (cm - MIN_CM) / (MAX_CM - MIN_CM)
  return Math.round(MIN_PX + ratio * (MAX_PX - MIN_PX))
}

function DimensionsStep({
  length,
  width,
  height,
  onChange,
}: DimensionsStepProps) {
  const boxStyle = {
    '--parcel-w': toPx(width),
    '--parcel-d': toPx(length),
    '--parcel-h': toPx(height),
  } as CSSProperties

  return (
    <div className="dimensions-step">
      <h2 className="order-step__heading">Bitte legen Sie die Maße fest.</h2>

      <div className="parcel-stage">
        <div className="parcel" style={boxStyle}>
          <div className="parcel__face parcel__face--top" />
          <div className="parcel__face parcel__face--front" />
          <div className="parcel__face parcel__face--right" />
        </div>
      </div>

      <div className="dimensions-step__sliders">
        <DimensionSlider
          label="Länge"
          value={length}
          min={MIN_CM}
          max={MAX_CM}
          step={5}
          onChange={(value) => onChange({ length: value })}
        />
        <DimensionSlider
          label="Breite"
          value={width}
          min={MIN_CM}
          max={MAX_CM}
          step={5}
          onChange={(value) => onChange({ width: value })}
        />
        <DimensionSlider
          label="Höhe"
          value={height}
          min={MIN_CM}
          max={MAX_CM}
          step={5}
          onChange={(value) => onChange({ height: value })}
        />
      </div>
    </div>
  )
}

export default DimensionsStep
