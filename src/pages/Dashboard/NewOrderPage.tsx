import { useState, type ChangeEvent, type FormEvent } from 'react'
import { CameraIcon, PinIcon } from '../../components/icons/NavIcons'
import './NewOrderPage.css'

function NewOrderPage() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [description, setDescription] = useState('')

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <div className="new-order-page">
      <h1 className="new-order-page__title">Neuer Auftrag</h1>
      <p className="new-order-page__subtitle">
        Beschreiben Sie Ihren Transport in wenigen Schritten.
      </p>

      <form className="new-order-page__form" onSubmit={handleSubmit} noValidate>
        <label className="new-order-page__photo">
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {photoPreview ? (
            <img
              src={photoPreview}
              alt=""
              className="new-order-page__photo-preview"
            />
          ) : (
            <span className="new-order-page__photo-placeholder">
              <CameraIcon />
              Foto hinzufügen
            </span>
          )}
        </label>

        <label className="new-order-page__field">
          <span>
            <PinIcon className="new-order-page__field-icon" />
            Abholadresse
          </span>
          <input
            type="text"
            placeholder="Straße, Hausnummer, Wien"
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
          />
        </label>

        <label className="new-order-page__field">
          <span>
            <PinIcon className="new-order-page__field-icon" />
            Zieladresse
          </span>
          <input
            type="text"
            placeholder="Straße, Hausnummer, Wien"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </label>

        <label className="new-order-page__field">
          <span>Beschreibung</span>
          <textarea
            rows={4}
            placeholder="Was möchten Sie transportieren?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <button type="submit" className="new-order-page__submit">
          Auftrag erstellen
        </button>
      </form>
    </div>
  )
}

export default NewOrderPage
