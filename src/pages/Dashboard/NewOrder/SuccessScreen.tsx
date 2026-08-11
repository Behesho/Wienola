import { CheckIcon } from './icons'
import './SuccessScreen.css'

interface SuccessScreenProps {
  onViewOffers: () => void
}

function SuccessScreen({ onViewOffers }: SuccessScreenProps) {
  return (
    <div className="success-screen">
      <div className="success-screen__badge-wrap">
        <div className="success-screen__glow" aria-hidden="true" />
        <div className="success-screen__badge">
          <CheckIcon className="success-screen__check" />
        </div>
      </div>

      <h2 className="success-screen__title">
        Vielen Dank für deinen Auftrag!
      </h2>
      <p className="success-screen__text">
        Dein Transportauftrag wurde erfolgreich veröffentlicht. Verschiedene
        Dienstleister können dir jetzt Preisangebote senden.
      </p>

      <button
        type="button"
        className="success-screen__cta"
        onClick={onViewOffers}
      >
        Meine Angebote ansehen
      </button>
    </div>
  )
}

export default SuccessScreen
