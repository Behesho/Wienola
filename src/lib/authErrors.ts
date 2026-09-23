/**
 * Supabase auth errors come back as English technical messages. These
 * helpers translate the common cases into clean German copy; anything
 * unrecognized falls back to a generic message rather than leaking the
 * raw technical text to the user.
 */

export function mapSignUpError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Diese E-Mail-Adresse ist bereits registriert.'
  }
  if (lower.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte versuchen Sie es in einigen Minuten erneut.'
  }
  if (lower.includes('password')) {
    return 'Bitte verwenden Sie ein gültiges Passwort.'
  }
  if (lower.includes('email') && lower.includes('invalid')) {
    return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
  }
  return 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
}

export function mapSignInError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials')) {
    return 'E-Mail-Adresse oder Passwort ist falsch.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.'
  }
  if (lower.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte versuchen Sie es in einigen Minuten erneut.'
  }
  return 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
}
