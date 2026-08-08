import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ClipboardIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
  SearchIcon,
} from '../icons/NavIcons'
import './BottomNav.css'

const NAV_ITEM_PATHS = [
  '/dashboard',
  '/dashboard/search',
  '/dashboard/orders',
  '/dashboard/profile',
]

interface BubbleRect {
  x: number
  y: number
  width: number
  height: number
}

function isPathActive(path: string, pathname: string) {
  return path === '/dashboard'
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`)
}

function BottomNav() {
  const location = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [bubble, setBubble] = useState<BubbleRect | null>(null)

  const activeIndex = NAV_ITEM_PATHS.findIndex((path) =>
    isPathActive(path, location.pathname),
  )

  // Kept in sync every render so the resize handler (attached once, below)
  // never closes over a stale index.
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  // Stable ref callbacks — created once, so React never detaches/reattaches
  // them on unrelated re-renders (which "activeIndex" changing causes).
  const itemRefCallbacks = useRef(
    NAV_ITEM_PATHS.map(
      (_, index) => (el: HTMLAnchorElement | null) => {
        itemRefs.current[index] = el
      },
    ),
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
  }, [activeIndex, measure])

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

        <NavLink
          to="/dashboard"
          end
          ref={itemRefCallbacks[0]}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <HomeIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Home</span>
        </NavLink>

        <NavLink
          to="/dashboard/search"
          ref={itemRefCallbacks[1]}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <SearchIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Suchen</span>
        </NavLink>

        <NavLink
          to="/dashboard/new-order"
          className="bottom-nav__fab"
          aria-label="Neuen Transportauftrag erstellen"
        >
          <PlusIcon className="bottom-nav__fab-icon" />
        </NavLink>

        <NavLink
          to="/dashboard/orders"
          ref={itemRefCallbacks[2]}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <ClipboardIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Auftrag</span>
        </NavLink>

        <NavLink
          to="/dashboard/profile"
          ref={itemRefCallbacks[3]}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <PersonIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Profil</span>
        </NavLink>
      </div>
    </nav>
  )
}

export default BottomNav
