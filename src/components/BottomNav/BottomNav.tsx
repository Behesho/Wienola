import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import {
  BellIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
} from '../icons/NavIcons'
import { useAuth } from '../../context/useAuth'
import { useNotifications } from '../../context/useNotifications'
import './BottomNav.css'

interface NavItemConfig {
  path: string
  end?: boolean
  /** Sub-pages that keep this item highlighted. */
  alsoActive?: string[]
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const CUSTOMER_ITEMS: NavItemConfig[] = [
  {
    path: '/dashboard',
    end: true,
    alsoActive: ['/dashboard/prices'],
    label: 'Home',
    icon: HomeIcon,
  },
  { path: '/dashboard/notifications', label: 'Mitteilungen', icon: BellIcon },
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
  if (item.alsoActive?.includes(pathname)) return true
  return item.end
    ? pathname === item.path
    : pathname === item.path || pathname.startsWith(`${item.path}/`)
}

function NavIcon({
  item,
  unreadCount,
}: {
  item: NavItemConfig
  unreadCount: number
}) {
  const showBadge = item.path === '/dashboard/notifications' && unreadCount > 0
  return (
    <span className="bottom-nav__icon-wrap">
      <item.icon className="bottom-nav__icon" />
      {showBadge && (
        <span className="bottom-nav__badge" aria-label={`${unreadCount} ungelesen`}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </span>
  )
}

function BottomNav() {
  const { role } = useAuth()
  const { unreadCount } = useNotifications()
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
            className={() =>
              `bottom-nav__item${isPathActive(item, location.pathname) ? ' bottom-nav__item--active' : ''}`
            }
          >
            <NavIcon item={item} unreadCount={unreadCount} />
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
              className={() =>
                `bottom-nav__item${isPathActive(item, location.pathname) ? ' bottom-nav__item--active' : ''}`
              }
            >
              <NavIcon item={item} unreadCount={unreadCount} />
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  )
}

export default BottomNav
