import { useNavigate } from 'react-router-dom'
import BrandLogo from '../../../components/BrandLogo/BrandLogo'
import { useAuth } from '../../../context/useAuth'
import './DriverCalendarPage.css'

/** A newly registered driver waits here until the admin presses "Freischalten". */
function PendingApprovalPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="pending-page">
      <BrandLogo size="lg" showTagline />
      <h1 className="driver-calendar__title">Fast geschafft</h1>
      <p className="driver-calendar__hint">
        Dein Konto wartet auf die Freischaltung durch den Admin. Sobald es
        freigeschaltet ist, siehst du hier neue Aufträge. Bitte schau später
        noch einmal vorbei.
      </p>
      <button type="button" className="dc-btn" onClick={handleLogout}>
        Abmelden
      </button>
    </div>
  )
}

export default PendingApprovalPage
