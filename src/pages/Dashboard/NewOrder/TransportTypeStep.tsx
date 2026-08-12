import type { TransportType } from './types'
import {
  CourierIcon,
  EnvelopeIcon,
  HouseMoveIcon,
  MoreIcon,
  ShieldIcon,
  SingleBoxIcon,
  StackedBoxesIcon,
  TrashIcon,
} from './icons'
import './TransportTypeStep.css'

interface TransportTypeStepProps {
  transportType: TransportType | null
  onChange: (type: TransportType) => void
}

const TRANSPORT_TYPES: {
  type: TransportType
  title: string
  subtitle: string
  icon: typeof HouseMoveIcon
}[] = [
  {
    type: 'moving',
    title: 'Kompletter Umzug',
    subtitle: 'Ein kompletter Wohnungs- oder Hausumzug.',
    icon: HouseMoveIcon,
  },
  {
    type: 'multiple',
    title: 'Mehrere Gegenstände',
    subtitle: 'Mehrere Möbelstücke, Kartons oder andere Gegenstände.',
    icon: StackedBoxesIcon,
  },
  {
    type: 'single',
    title: 'Einzelstück',
    subtitle: 'z. B. Sofa, Tisch, Stuhl oder Schrank',
    icon: SingleBoxIcon,
  },
  {
    type: 'disposal',
    title: 'Entsorgung',
    subtitle: 'Transport zum Mistplatz.',
    icon: TrashIcon,
  },
  {
    type: 'letter',
    title: 'Brief',
    subtitle: 'Dokumente oder Briefe schnell zustellen.',
    icon: EnvelopeIcon,
  },
  {
    type: 'courier',
    title: 'Kurier',
    subtitle: 'Kleine Sendungen schnell transportieren.',
    icon: CourierIcon,
  },
  {
    type: 'valuable',
    title: 'Werttransport',
    subtitle: 'Für wertvolle oder besonders sensible Sendungen.',
    icon: ShieldIcon,
  },
  {
    type: 'other',
    title: 'Sonstiges',
    subtitle: 'Eine andere Transportart.',
    icon: MoreIcon,
  },
]

function TransportTypeStep({
  transportType,
  onChange,
}: TransportTypeStepProps) {
  return (
    <div className="transport-type-step">
      <h2 className="order-step__heading">Was möchtest du versenden?</h2>

      <div className="transport-type-step__grid">
        {TRANSPORT_TYPES.map(({ type, title, subtitle, icon: Icon }) => (
          <button
            key={type}
            type="button"
            className={`transport-type-card${transportType === type ? ' transport-type-card--selected' : ''}`}
            aria-pressed={transportType === type}
            onClick={() => onChange(type)}
          >
            <Icon className="transport-type-card__icon" />
            <span className="transport-type-card__title">{title}</span>
            <span className="transport-type-card__subtitle">{subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TransportTypeStep
