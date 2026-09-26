import { useRef, useState, type ChangeEvent } from 'react'
import { CameraIcon } from '../../../components/icons/NavIcons'
import { imageFileToDataUrl } from '../../../lib/imageUpload'
import './SlipUpload.css'

interface SlipUploadProps {
  slip: string | null
  variant?: 'post' | 'willhaben'
  onChange: (slip: string | null) => void
}

const TEXTS = {
  post: {
    heading: 'Abholschein der Post',
    cta: '+ Abholschein hochladen',
    hint: 'Foto vom Zettel, den der Dienstleister zum Abholen braucht',
    alt: 'Abholschein',
  },
  willhaben: {
    heading: 'Willhaben-Beleg',
    cta: '+ Beleg hochladen',
    hint: 'Screenshot der Anzeige oder der Nachricht des Verkäufers',
    alt: 'Willhaben-Beleg',
  },
}

/** Optional upload of the Post slip (Abholschein) needed to collect mail. */
function SlipUpload({ slip, variant = 'post', onChange }: SlipUploadProps) {
  const texts = TEXTS[variant]
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
      <h3 className="slip-upload__heading">{texts.heading}</h3>

      <label className="slip-upload__dropzone">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {slip ? (
          <img src={slip} alt={texts.alt} className="slip-upload__preview" />
        ) : (
          <span className="slip-upload__placeholder">
            <CameraIcon className="slip-upload__icon" />
            <span className="slip-upload__cta">{texts.cta}</span>
            <span className="slip-upload__hint">
              {texts.hint}
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
