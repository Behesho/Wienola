import { useNavigate } from 'react-router-dom'
import DashboardSection from '../../components/DashboardSection/DashboardSection'
import PriceCalculator from '../../components/PriceCalculator/PriceCalculator'
import PriceList from '../../components/PriceCalculator/PriceList'
import ContactButtons from '../../components/ContactButtons/ContactButtons'
import { ChevronLeftIcon } from './NewOrder/icons'
import './PricesPage.css'

/** Sub-page of Home: price calculator, price list and contact buttons. */
function PricesPage() {
  const navigate = useNavigate()

  return (
    <div className="prices-page">
      <div className="prices-page__header">
        <button
          type="button"
          className="prices-page__back"
          onClick={() => navigate('/dashboard')}
          aria-label="Zurück zur Startseite"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="prices-page__title">Preisrechner</h1>
      </div>

      <DashboardSection title="Preis berechnen">
        <PriceCalculator />
      </DashboardSection>

      <DashboardSection title="Preisliste">
        <PriceList />
      </DashboardSection>

      <ContactButtons />
    </div>
  )
}

export default PricesPage
