import { useState, type FormEvent, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import './Auth.css'

type Role = 'customer' | 'provider'

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6" />
    </svg>
  )
}

function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="1.5" y="7" width="11" height="9" rx="1.2" />
      <path d="M12.5 10h4.2l3.3 3.3V16h-7.5z" />
      <circle cx="6" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </svg>
  )
}

function RegisterPage() {
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setError('')
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <BrandLogo size="lg" showTagline />

        <h1 className="auth__title">Konto erstellen</h1>
        <p className="auth__subtitle">
          Registrieren Sie sich, um Lasten-Wien zu nutzen.
        </p>

        <div className="role-select">
          <span className="role-select__title">Wer bist du?</span>
          <div className="role-select__options">
            <button
              type="button"
              className={`role-card${role === 'customer' ? ' role-card--selected' : ''}`}
              aria-pressed={role === 'customer'}
              onClick={() => setRole('customer')}
            >
              <UserIcon className="role-card__icon" />
              <span className="role-card__title">Kunde_in</span>
              <span className="role-card__subtitle">
                Ich suche einen Transport.
              </span>
            </button>

            <button
              type="button"
              className={`role-card${role === 'provider' ? ' role-card--selected' : ''}`}
              aria-pressed={role === 'provider'}
              onClick={() => setRole('provider')}
            >
              <TruckIcon className="role-card__icon" />
              <span className="role-card__title">Dienstleister</span>
              <span className="role-card__subtitle">
                Ich transportiere Waren.
              </span>
            </button>
          </div>
        </div>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span>Name</span>
            <input
              type="text"
              autoComplete="name"
              placeholder="Max Mustermann"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span>E-Mail-Adresse</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@beispiel.at"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span>Passwort</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span>Passwort bestätigen</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              aria-invalid={error ? 'true' : 'false'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {error && <span className="auth__error">{error}</span>}
          </label>

          <label className="auth__checkbox">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              Ich stimme den{' '}
              <a href="#" onClick={(event) => event.preventDefault()}>
                AGB
              </a>{' '}
              und der{' '}
              <a href="#" onClick={(event) => event.preventDefault()}>
                Datenschutzerklärung
              </a>{' '}
              zu.
            </span>
          </label>

          <button type="submit" className="auth__submit" disabled={!agreed}>
            Registrieren
          </button>
        </form>

        <p className="auth__switch">
          Bereits ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
