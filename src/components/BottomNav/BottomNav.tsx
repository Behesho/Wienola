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
  UsersIcon,
} from '../icons/NavIcons'
import { useAuth } from '../../context/useAuth'
import { usePoll } from '../../hooks/usePoll'
import { fetchOrderIdsRejectedBy } from '../../lib/admin'
import { fetchOpenOrderIds } from '../../lib/orders'
import { CalendarIcon, ShieldIcon } from '../../pages/Dashboard/NewOrder/icons'
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
  { path: '/dashboard/calendar', label: 'Kalender', icon: CalendarIcon },
  { path: '/dashboard/profile', label: 'Profil', icon: PersonIcon },
]

const ADMIN_ITEMS: NavItemConfig[] = [
  { path: '/dashboard', end: true, label: 'Home', icon: HomeIcon },
  { path: '/dashboard/admin', label: 'Admin', icon: ShieldIcon },
  { path: '/dashboard/orders', label: 'Aufträge', icon: ClipboardIcon },
  { path: '/dashboard/drivers', label: 'Fahrer', icon: UsersIcon },
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

function NavIcon({ item, badge }: { item: NavItemConfig; badge: number }) {
  return (
    <span className="bottom-nav__icon-wrap">
      <item.icon className="bottom-nav__icon" />
      {badge > 0 && (
        <span className="bottom-nav__badge" aria-label={`${badge} neu`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </span>
  )
}

function BottomNav() {
  const { role, profile, user } = useAuth()
  const { unreadCount } = useNotifications()
  const isAdmin = profile?.is_admin ?? false

  // Admin: number of new free orders on the "Aufträge" tab.
  const adminId = user?.id ?? ''
  const newOrders = usePoll(async () => {
    if (!isAdmin) return 0
    const [open, rejected] = await Promise.all([
      fetchOpenOrderIds(),
      fetchOrderIdsRejectedBy(adminId),
    ])
    const skip = new Set(rejected)
    return (open.data ?? []).filter((row) => !skip.has(row.id)).length
  })
  const badgeFor = (item: NavItemConfig) => {
    if (item.path === '/dashboard/notifications') return unreadCount
    if (isAdmin && item.path === '/dashboard/orders') return newOrders.data ?? 0
    return 0
  }
  const location = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [bubble, setBubble] = useState<BubbleRect | null>(null)

  // The driver and customer configs always have exactly 4 regular items —
  // only the FAB's presence and the items' content differ — so the same
  // four stable ref callbacks work for either role.
  const items = isAdmin
    ? ADMIN_ITEMS
    : role === 'dienstleister'
      ? DRIVER_ITEMS
      : CUSTOMER_ITEMS
  const showFab = !isAdmin && role !== 'dienstleister'

  const activeIndex = items.findIndex((item) => isPathActive(item, location.pathname))

  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const itemRefCallbacks = useRef(
    Array.from({ length: 5 }, (_, index) => (el: HTMLAnchorElement | null) => {
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
            <NavIcon item={item} badge={badgeFor(item)} />
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
              <NavIcon item={item} badge={badgeFor(item)} />
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  )
}

export default BottomNav
