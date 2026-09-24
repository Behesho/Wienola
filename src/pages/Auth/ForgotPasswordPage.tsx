import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import { supabase } from '../../lib/supabase'
import './Auth.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setNotice('')
    setSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )

    setSubmitting(false)

    if (resetError) {
      setError(
        resetError.status === 429
          ? 'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.'
          : 'Der Link konnte nicht gesendet werden. Bitte versuche es erneut.',
      )
      return
    }

    setNotice(
      'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.',
    )
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <BrandLogo size="lg" showTagline />

        <h1 className="auth__title">Passwort vergessen?</h1>
        <p className="auth__subtitle">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum
          Zurücksetzen.
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

          {error && <p className="auth__error">{error}</p>}
          {notice && <p className="auth__notice">{notice}</p>}

          <button
            type="submit"
            className="auth__submit"
            disabled={submitting || !email.trim()}
          >
            {submitting ? 'Wird gesendet…' : 'Link senden'}
          </button>
        </form>

        <p className="auth__switch">
          Zurück zur <Link to="/login">Anmeldung</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
