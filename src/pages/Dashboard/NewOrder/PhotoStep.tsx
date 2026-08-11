import { useRef, type ChangeEvent } from 'react'
import { CameraIcon } from '../../../components/icons/NavIcons'
import './PhotoStep.css'

interface PhotoStepProps {
  photo: string | null
  onChange: (photo: string | null) => void
}

function PhotoStep({ photo, onChange }: PhotoStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    onChange(file ? URL.createObjectURL(file) : null)
  }

  function handleRemove() {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="photo-step">
      <h2 className="order-step__heading">Was möchtest du transportieren?</h2>

      <label className="photo-step__dropzone">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {photo ? (
          <img src={photo} alt="" className="photo-step__preview" />
        ) : (
          <span className="photo-step__placeholder">
            <CameraIcon className="photo-step__icon" />
            <span className="photo-step__cta">+ Foto hinzufügen</span>
            <span className="photo-step__hint">
              Kamera oder aus der Fotomediathek wählen
            </span>
          </span>
        )}
      </label>

      {photo && (
        <button
          type="button"
          className="photo-step__remove"
          onClick={handleRemove}
        >
          Foto entfernen
        </button>
      )}
    </div>
  )
}

export default PhotoStep
