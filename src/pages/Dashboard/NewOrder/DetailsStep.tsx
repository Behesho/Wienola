import './DetailsStep.css'

interface DetailsStepProps {
  description: string
  onChange: (description: string) => void
}

function DetailsStep({ description, onChange }: DetailsStepProps) {
  return (
    <div className="details-step">
      <h2 className="order-step__heading">Was möchtest du transportieren?</h2>

      <textarea
        className="details-step__textarea"
        rows={6}
        placeholder="z. B. Sofa, Waschmaschine, 5 Umzugskartons …"
        value={description}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export default DetailsStep
