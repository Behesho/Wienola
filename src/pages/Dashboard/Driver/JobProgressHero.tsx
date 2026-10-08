import type { SVGProps } from 'react'
import { BikeIcon, CarIcon, CheckIcon, TruckIcon, VanIcon } from '../NewOrder/icons'
import { PinIcon } from '../../../components/icons/NavIcons'
import type { OrderStatus } from '../../../types/order'
import type { VehicleType } from '../NewOrder/types'
import './JobProgressHero.css'

const VEHICLE_ICONS = {
  bike: BikeIcon,
  car: CarIcon,
  van: VanIcon,
  truck: TruckIcon,
} as const

/** Customer hands the package over to the driver (green cap). */
function HandoverScene() {
  return (
    <svg viewBox="0 0 260 130" className="job-hero__scene" aria-hidden="true">
      <line x1="10" y1="120" x2="250" y2="120" className="job-hero__ground" />

      {/* customer */}
      <circle cx="62" cy="34" r="13" className="job-hero__skin" />
      <rect x="44" y="51" width="36" height="46" rx="14" className="job-hero__customer" />
      <rect x="49" y="92" width="10" height="27" rx="4" className="job-hero__customer" />
      <rect x="65" y="92" width="10" height="27" rx="4" className="job-hero__customer" />
      <path d="M76 62 L104 70" className="job-hero__arm job-hero__arm--customer" />

      {/* package */}
      <g className="job-hero__package">
        <rect x="102" y="56" width="40" height="30" rx="4" className="job-hero__box" />
        <rect x="119" y="56" width="6" height="30" className="job-hero__tape" />
      </g>

      {/* handover arrow */}
      <path d="M104 38 H140" className="job-hero__flow" />
      <path d="M134 32 L141 38 L134 44" className="job-hero__flow-head" />

      {/* driver */}
      <circle cx="190" cy="34" r="13" className="job-hero__skin" />
      <path d="M176 30 a14 12 0 0 1 28 0 v3 h-28 Z" className="job-hero__driver" />
      <rect x="198" y="30" width="12" height="4" rx="2" className="job-hero__driver" />
      <rect x="172" y="51" width="36" height="46" rx="14" className="job-hero__driver" />
      <rect x="177" y="92" width="10" height="27" rx="4" className="job-hero__driver-dark" />
      <rect x="193" y="92" width="10" height="27" rx="4" className="job-hero__driver-dark" />
      <path d="M176 62 L142 70" className="job-hero__arm job-hero__arm--driver" />
    </svg>
  )
}

function VehicleScene({
  vehicle,
  moving,
}: {
  vehicle: VehicleType | null
  moving: boolean
}) {
  const Icon = VEHICLE_ICONS[vehicle ?? 'van']
  return (
    <div className={`job-hero__vehicle-scene${moving ? ' job-hero__vehicle-scene--moving' : ''}`}>
      <span className="job-hero__speed" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <Icon className="job-hero__vehicle" />
      {moving && (
        <>
          <span className="job-hero__road" aria-hidden="true" />
          <PinIcon className="job-hero__pin" />
        </>
      )}
    </div>
  )
}

function DeliveredScene() {
  return (
    <div className="job-hero__delivered">
      <HouseIcon className="job-hero__house" />
      <span className="job-hero__done-badge">
        <CheckIcon />
      </span>
    </div>
  )
}

function HouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  )
}

const SCENES: Partial<
  Record<OrderStatus, { title: string; subtitle: string }>
> = {
  accepted: {
    title: 'Paket abholen',
    subtitle: 'Fahre zur Abholadresse und übernimm das Paket vom Kunden.',
  },
  picked_up: {
    title: 'Bereit zur Abfahrt',
    subtitle: 'Das Paket ist an Bord – starte den Transport.',
  },
  in_transit: {
    title: 'Unterwegs zur Zustellung',
    subtitle: 'Fahre zur markierten Zustelladresse.',
  },
  delivered: {
    title: 'Zugestellt',
    subtitle: 'Schließe den Auftrag ab, sobald alles erledigt ist.',
  },
}

interface JobProgressHeroProps {
  status: OrderStatus
  vehicle: VehicleType | null
  /** One-line delivery address, shown while driving there. */
  destination: string
  actionLabel: string
  busy: boolean
  error: string | null
  onAction: () => void
}

/**
 * Top of a driver's own job: an illustration of the current stage plus the
 * one button that moves the job to the next stage.
 */
function JobProgressHero({
  status,
  vehicle,
  destination,
  actionLabel,
  busy,
  error,
  onAction,
}: JobProgressHeroProps) {
  const scene = SCENES[status]
  if (!scene) return null

  return (
    <section className="job-hero" key={status}>
      <div className="job-hero__art">
        {status === 'accepted' && <HandoverScene />}
        {status === 'picked_up' && <VehicleScene vehicle={vehicle} moving={false} />}
        {status === 'in_transit' && <VehicleScene vehicle={vehicle} moving />}
        {status === 'delivered' && <DeliveredScene />}
      </div>

      <h2 className="job-hero__title">{scene.title}</h2>
      <p className="job-hero__subtitle">{scene.subtitle}</p>

      {status === 'in_transit' && destination && (
        <p className="job-hero__destination">
          <PinIcon />
          {destination}
        </p>
      )}

      {error && <p className="job-hero__error">{error}</p>}

      <button
        type="button"
        className="job-hero__action"
        onClick={onAction}
        disabled={busy}
      >
        {busy ? 'Wird aktualisiert…' : actionLabel}
      </button>
    </section>
  )
}

export default JobProgressHero
