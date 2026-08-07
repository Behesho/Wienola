import { NavLink } from 'react-router-dom'
import {
  ClipboardIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
  SearchIcon,
} from '../icons/NavIcons'
import './BottomNav.css'

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      <div className="bottom-nav__bar">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <HomeIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Home</span>
        </NavLink>

        <NavLink
          to="/dashboard/search"
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
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <ClipboardIcon className="bottom-nav__icon" />
          <span className="bottom-nav__label">Auftrag</span>
        </NavLink>

        <NavLink
          to="/dashboard/profile"
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
