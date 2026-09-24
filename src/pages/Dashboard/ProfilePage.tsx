import { useNavigate } from 'react-router-dom'
import { PersonIcon } from '../../components/icons/NavIcons'
import DashboardSection from '../../components/DashboardSection/DashboardSection'
import ThemeSelector from '../../components/ThemeSelector/ThemeSelector'
import DriverNotificationSettings from '../../components/DriverNotificationSettings/DriverNotificationSettings'
import { useAuth } from '../../context/useAuth'
import './ProfilePage.css'

function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, role, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <PersonIcon className="profile-page__avatar-icon" />
        </div>
        <div>
          <p className="profile-page__name">
            {profile?.full_name || 'Nutzer_in'}
          </p>
          <p className="profile-page__email">{user?.email}</p>
        </div>
      </div>

      <DashboardSection title="Konto">
        <p>Persönliche Daten, Zahlungsmethoden und Einstellungen folgen in Kürze.</p>
        <button
          type="button"
          className="profile-page__logout"
          onClick={handleLogout}
        >
          Abmelden
        </button>
      </DashboardSection>

      <DashboardSection title="Darstellung">
        <ThemeSelector />
      </DashboardSection>

      {role === 'dienstleister' && (
        <DashboardSection title="Benachrichtigungen">
          <DriverNotificationSettings />
        </DashboardSection>
      )}

      <DashboardSection title="Support">
        <p>Hilfe &amp; Kontakt sind demnächst hier verfügbar.</p>
      </DashboardSection>
    </div>
  )
}

export default ProfilePage
