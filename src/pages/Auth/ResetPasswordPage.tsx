import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import AuthLoading from '../../components/ProtectedRoute/AuthLoading'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import './Auth.css'

/**
 * Landing page of the "Passwort zurücksetzen" e-mail link. Supabase signs the
 * user in with a recovery session from the link, so this route sits outside
 * both PublicOnlyRoute (which would bounce that session away) and
 * ProtectedRoute.
 */
function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setError('')
    setSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setSubmitting(false)

    if (updateError) {
      setError(
        'Das Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.',
      )
      return
    }

    navigate('/dashboard', { replace: true })
  }

  if (loading) {
    return <AuthLoading />
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <BrandLogo size="lg" showTagline />

        <h1 className="auth__title">Neues Passwort</h1>

        {session ? (
          <>
            <p className="auth__subtitle">Wähle ein neues Passwort.</p>

            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              <label className="auth__field">
                <span>Neues Passwort</span>
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
              </label>

              {error && <p className="auth__error">{error}</p>}

              <button
                type="submit"
                className="auth__submit"
                disabled={submitting}
              >
                {submitting ? 'Wird gespeichert…' : 'Passwort speichern'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth__error">
              Dieser Link ist ungültig oder abgelaufen.
            </p>
            <p className="auth__switch">
              <Link to="/forgot-password">Neuen Link anfordern</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
