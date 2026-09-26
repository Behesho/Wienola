import type { SVGProps } from 'react'
import { PhoneIcon } from '../icons/NavIcons'
import { CONTACT } from '../../lib/contact'
import './ContactButtons.css'

function svgProps(props: SVGProps<SVGSVGElement>) {
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

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19L4 20Z" />
      <path d="M9.2 8.8c.2 2.2 2.8 4.8 5 5l1.2-1.1-1.9-1-.8.6a4 4 0 0 1-1.6-1.6l.6-.8-1-1.9-1.5 1.8Z" />
    </svg>
  )
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

const digits = (value: string) => value.replace(/\D/g, '')

/** Call, WhatsApp and e-mail buttons side by side. */
function ContactButtons() {
  const items = [
    CONTACT.phone && {
      key: 'phone',
      label: 'Anrufen',
      href: `tel:${CONTACT.phone.replace(/\s/g, '')}`,
      icon: PhoneIcon,
    },
    CONTACT.whatsapp && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${digits(CONTACT.whatsapp)}`,
      icon: WhatsAppIcon,
      external: true,
    },
    CONTACT.email && {
      key: 'email',
      label: 'E-Mail',
      href: `mailto:${CONTACT.email}`,
      icon: MailIcon,
    },
  ].filter(Boolean) as {
    key: string
    label: string
    href: string
    icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element
    external?: boolean
  }[]

  if (items.length === 0) return null

  return (
    <div className="contact-buttons">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          className={`contact-buttons__button contact-buttons__button--${item.key}`}
          {...(item.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          <item.icon className="contact-buttons__icon" />
          {item.label}
        </a>
      ))}
    </div>
  )
}

export default ContactButtons
