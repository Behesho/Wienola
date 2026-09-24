import './ContactStep.css'

interface ContactStepProps {
  contactPhone: string
  onChange: (patch: { contactPhone: string }) => void
}

function ContactStep({ contactPhone, onChange }: ContactStepProps) {
  return (
    <div className="contact-step">
      <h2 className="order-step__heading">Kontakt</h2>

      <label className="contact-step__field">
        <span>Telefonnummer</span>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+43 664 123 456"
          value={contactPhone}
          onChange={(event) => onChange({ contactPhone: event.target.value })}
        />
      </label>
    </div>
  )
}

export default ContactStep
