import { Link } from 'react-router-dom'
import ContactButtons from '../../components/ContactButtons/ContactButtons'
import { useAuth } from '../../context/useAuth'
import './HomePage.css'

function CalculatorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="home-page__tile-icon"
    >
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 7.5h7" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="home-page__tile-icon"
    >
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4" />
      <path d="M12 11v10" />
    </svg>
  )
}

function HomePage() {
  const { profile } = useAuth()

  return (
    <div className="home-page">
      <h1 className="home-page__title">
        Hallo{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>

      <Link to="/dashboard/prices" className="home-page__tile">
        <CalculatorIcon />
        <span className="home-page__tile-text">
          <span className="home-page__tile-title">Preisrechner</span>
          <span className="home-page__tile-subtitle">
            Preise für Abholung und Zustellung berechnen
          </span>
        </span>
        <span className="home-page__tile-arrow" aria-hidden="true">
          ›
        </span>
      </Link>

      <ContactButtons />

      <Link to="/dashboard/new-order" className="home-page__tile">
        <PackageIcon />
        <span className="home-page__tile-text">
          <span className="home-page__tile-title">Post Abholung</span>
          <span className="home-page__tile-subtitle">
            Neuen Transportauftrag erstellen
          </span>
        </span>
        <span className="home-page__tile-arrow" aria-hidden="true">
          ›
        </span>
      </Link>
    </div>
  )
}

export default HomePage
