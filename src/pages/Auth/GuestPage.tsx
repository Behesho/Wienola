import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import { supabase } from '../../lib/supabase'
import './Auth.css'

/** Guest access: name, phone and e-mail only, no password. */
function GuestPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Bitte fülle Name, Telefonnummer und E-Mail-Adresse aus.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.')
      return
    }

    setError('')
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: 'customer',
        },
      },
    })

    setSubmitting(false)

    if (signInError) {
      setError(
        signInError.status === 429
          ? 'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.'
          : 'Der Gastzugang ist derzeit nicht verfügbar. Bitte registriere dich oder versuche es später erneut.',
      )
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <BrandLogo size="lg" showTagline />

        <h1 className="auth__title">Als Gast fortfahren</h1>
        <p className="auth__subtitle">
          Wir brauchen nur deine Kontaktdaten, damit der Dienstleister dich
          erreichen kann.
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
            <span>Telefonnummer</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+43 660 1234567"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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

          {error && <p className="auth__error">{error}</p>}

          <button type="submit" className="auth__submit" disabled={submitting}>
            {submitting ? 'Einen Moment…' : 'Weiter als Gast'}
          </button>
        </form>

        <p className="auth__switch">
          Zurück zur <Link to="/login">Anmeldung</Link>
        </p>
      </div>
    </div>
  )
}

export default GuestPage
