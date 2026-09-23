import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import { supabase } from '../../lib/supabase'
import { mapSignInError } from '../../lib/authErrors'
import './Auth.css'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setSubmitting(false)

    if (signInError) {
      setError(mapSignInError(signInError.message))
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <BrandLogo size="lg" showTagline />

        <h1 className="auth__title">Willkommen zurück</h1>
        <p className="auth__subtitle">
          Melden Sie sich an, um fortzufahren.
        </p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="auth__error">{error}</p>}

          <button type="submit" className="auth__submit" disabled={submitting}>
            {submitting ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>

        <p className="auth__switch">
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
