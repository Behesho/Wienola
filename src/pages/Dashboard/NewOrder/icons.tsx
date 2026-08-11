import type { SVGProps } from 'react'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function BikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="5.5" cy="17.5" r="3.2" />
      <circle cx="18.5" cy="17.5" r="3.2" />
      <path d="M5.5 17.5 10 8h4l2.5 4.5M10 8H7.5M12.5 12.5h6" />
    </svg>
  )
}

export function CarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.5 16v-3.2l1.8-4A2 2 0 0 1 8.1 7.5h7.8a2 2 0 0 1 1.8 1.3l1.8 4V16" />
      <path d="M3.5 16h17v2a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.5H6.7v.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="16" r="1.4" />
      <circle cx="16.5" cy="16" r="1.4" />
    </svg>
  )
}

export function VanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 7.5h11v9H3z" />
      <path d="M14 11h3.3L20 13.7v2.8h-6z" />
      <circle cx="7" cy="17.2" r="1.6" />
      <circle cx="17" cy="17.2" r="1.6" />
    </svg>
  )
}

export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M2.5 6.5h9v9.5h-9z" />
      <path d="M11.5 10.5h3.3L18 13.2v2.8h-6.5z" />
      <path d="M2.5 9.5h9" />
      <circle cx="6" cy="17.5" r="1.6" />
      <circle cx="15.5" cy="17.5" r="1.6" />
    </svg>
  )
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8 3.5v3.5M16 3.5v3.5" />
    </svg>
  )
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8v4.7l3 2" />
    </svg>
  )
}

export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12.5 3 5 13.5h5.5L11 21l7.5-10.5H13z" />
    </svg>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M15 19 8 12l7-7" />
    </svg>
  )
}
