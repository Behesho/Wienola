import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import logoIcon from '../../assets/logo-icon.png'
import { useSplashSequence } from '../../hooks/useSplashSequence'
import { useAuth } from '../../context/useAuth'
import './SplashScreen.css'

function SplashScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const handleComplete = useCallback(
    () => navigate(session ? '/dashboard' : '/login', { replace: true }),
    [navigate, session],
  )
  const { exiting } = useSplashSequence(handleComplete)

  return (
    <div className={`splash${exiting ? ' splash--exiting' : ''}`}>
      <div className="splash__content">
        <div className="splash__icon-wrap">
          <div className="splash__glow" aria-hidden="true" />
          <img src={logoIcon} alt="" className="splash__icon" />
        </div>
        <div className="splash__text">
          <h1 className="splash__wordmark">Lasten-Wien</h1>
          <p className="splash__tagline">Liefer- &amp; Transportservice</p>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
