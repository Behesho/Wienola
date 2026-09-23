import './ContactStep.css'

interface ContactStepProps {
  contactPhone: string
  amount: string
  onChange: (patch: { contactPhone?: string; amount?: string }) => void
}

function ContactStep({ contactPhone, amount, onChange }: ContactStepProps) {
  return (
    <div className="contact-step">
      <h2 className="order-step__heading">Kontakt &amp; Preis</h2>

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

      <label className="contact-step__field">
        <span>Auftragsbetrag</span>
        <div className="contact-step__amount">
          <span className="contact-step__currency">€</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(event) => onChange({ amount: event.target.value })}
          />
        </div>
      </label>
    </div>
  )
}

export default ContactStep
