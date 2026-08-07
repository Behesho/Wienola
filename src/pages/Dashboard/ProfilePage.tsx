import { PersonIcon } from '../../components/icons/NavIcons'
import DashboardSection from '../../components/DashboardSection/DashboardSection'
import './ProfilePage.css'

function ProfilePage() {
  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <PersonIcon className="profile-page__avatar-icon" />
        </div>
        <div>
          <p className="profile-page__name">Max Mustermann</p>
          <p className="profile-page__email">name@beispiel.at</p>
        </div>
      </div>

      <DashboardSection title="Konto">
        <p>Persönliche Daten, Zahlungsmethoden und Einstellungen folgen in Kürze.</p>
      </DashboardSection>

      <DashboardSection title="Support">
        <p>Hilfe &amp; Kontakt sind demnächst hier verfügbar.</p>
      </DashboardSection>
    </div>
  )
}

export default ProfilePage
