import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
  SearchIcon,
} from '../icons/NavIcons'
import { useAuth } from '../../context/useAuth'
import './BottomNav.css'

interface NavItemConfig {
  path: string
  end?: boolean
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const CUSTOMER_ITEMS: NavItemConfig[] = [
  { path: '/dashboard', end: true, label: 'Home', icon: HomeIcon },
  { path: '/dashboard/search', label: 'Suchen', icon: SearchIcon },
  { path: '/dashboard/orders', label: 'Auftrag', icon: ClipboardIcon },
  { path: '/dashboard/profile', label: 'Profil', icon: PersonIcon },
]

const DRIVER_ITEMS: NavItemConfig[] = [
  { path: '/dashboard', end: true, label: 'Home', icon: HomeIcon },
  { path: '/dashboard/my-jobs', label: 'Meine Jobs', icon: BriefcaseIcon },
  { path: '/dashboard/completed', label: 'Erledigt', icon: CheckCircleIcon },
  { path: '/dashboard/profile', label: 'Profil', icon: PersonIcon },
]

interface BubbleRect {
  x: number
  y: number
  width: number
  height: number
}

function isPathActive(item: NavItemConfig, pathname: string) {
  return item.end
    ? pathname === item.path
    : pathname === item.path || pathname.startsWith(`${item.path}/`)
}

function BottomNav() {
  const { role } = useAuth()
  const location = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [bubble, setBubble] = useState<BubbleRect | null>(null)

  // The driver and customer configs always have exactly 4 regular items —
  // only the FAB's presence and the items' content differ — so the same
  // four stable ref callbacks work for either role.
  const items = role === 'dienstleister' ? DRIVER_ITEMS : CUSTOMER_ITEMS
  const showFab = role !== 'dienstleister'

  const activeIndex = items.findIndex((item) => isPathActive(item, location.pathname))

  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const itemRefCallbacks = useRef(
    Array.from({ length: 4 }, (_, index) => (el: HTMLAnchorElement | null) => {
      itemRefs.current[index] = el
    }),
  ).current

  const measure = useCallback(() => {
    const bar = barRef.current
    const activeEl = itemRefs.current[activeIndexRef.current]
    if (!bar || !activeEl) {
      setBubble(null)
      return
    }
    const barRect = bar.getBoundingClientRect()
    const itemRect = activeEl.getBoundingClientRect()
    setBubble({
      x: itemRect.left - barRect.left,
      y: itemRect.top - barRect.top,
      width: itemRect.width,
      height: itemRect.height,
    })
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [activeIndex, measure, items])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      <div className="bottom-nav__bar" ref={barRef}>
        {bubble && (
          <div
            className="bottom-nav__bubble"
            style={{
              transform: `translate(${bubble.x}px, ${bubble.y}px)`,
              width: `${bubble.width}px`,
              height: `${bubble.height}px`,
            }}
            aria-hidden="true"
          />
        )}

        {items.slice(0, showFab ? 2 : items.length).map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            ref={itemRefCallbacks[index]}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
            }
          >
            <item.icon className="bottom-nav__icon" />
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}

        {showFab && (
          <NavLink
            to="/dashboard/new-order"
            className="bottom-nav__fab"
            aria-label="Neuen Transportauftrag erstellen"
          >
            <PlusIcon className="bottom-nav__fab-icon" />
          </NavLink>
        )}

        {showFab &&
          items.slice(2).map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              ref={itemRefCallbacks[index + 2]}
              className={({ isActive }) =>
                `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
              }
            >
              <item.icon className="bottom-nav__icon" />
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  )
}

export default BottomNav
