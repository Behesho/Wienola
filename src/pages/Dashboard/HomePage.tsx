import DashboardSection from '../../components/DashboardSection/DashboardSection'
import './HomePage.css'

function HomePage() {
  return (
    <div className="home-page">
      <h1 className="home-page__title">Transport senden</h1>

      <DashboardSection title="Willkommen">
        <p>Willkommen zurück bei Lasten-Wien.</p>
      </DashboardSection>

      <DashboardSection title="Schnellauftrag">
        <p>Erstellen Sie in wenigen Schritten einen neuen Transportauftrag.</p>
      </DashboardSection>

      <DashboardSection title="Letzte Aufträge">
        <p>Noch keine Aufträge vorhanden.</p>
      </DashboardSection>

      <DashboardSection title="Angebote">
        <p>Aktuell liegen keine Angebote vor.</p>
      </DashboardSection>

      <DashboardSection title="Aktuelle Transporte">
        <p>Keine aktiven Transporte.</p>
      </DashboardSection>
    </div>
  )
}

export default HomePage
