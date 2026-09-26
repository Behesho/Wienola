import { useRef, useState, type ChangeEvent } from 'react'
import { CameraIcon } from '../../../components/icons/NavIcons'
import { imageFileToDataUrl } from '../../../lib/imageUpload'
import './SlipUpload.css'

interface SlipUploadProps {
  slip: string | null
  onChange: (slip: string | null) => void
}

/** Optional upload of the Post slip (Abholschein) needed to collect mail. */
function SlipUpload({ slip, onChange }: SlipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      onChange(await imageFileToDataUrl(file))
    } catch {
      setError('Das Bild konnte nicht gelesen werden. Bitte versuche ein anderes.')
    }
  }

  function handleRemove() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="slip-upload">
      <h3 className="slip-upload__heading">Abholschein der Post</h3>

      <label className="slip-upload__dropzone">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {slip ? (
          <img src={slip} alt="Abholschein" className="slip-upload__preview" />
        ) : (
          <span className="slip-upload__placeholder">
            <CameraIcon className="slip-upload__icon" />
            <span className="slip-upload__cta">+ Abholschein hochladen</span>
            <span className="slip-upload__hint">
              Foto vom Zettel, den der Dienstleister zum Abholen braucht
            </span>
          </span>
        )}
      </label>

      {slip && (
        <button type="button" className="slip-upload__remove" onClick={handleRemove}>
          Bild entfernen
        </button>
      )}
      {error && <p className="slip-upload__error">{error}</p>}
    </div>
  )
}

export default SlipUpload
