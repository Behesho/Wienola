import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import './Auth.css'

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

          <button type="submit" className="auth__submit">
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
