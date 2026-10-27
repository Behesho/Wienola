import { PersonIcon } from '../icons/NavIcons'
import { ShieldIcon, VanIcon } from '../../pages/Dashboard/NewOrder/icons'
import { useAuth } from '../../context/useAuth'
import './RoleBadge.css'

/** Shows which kind of account is signed in: Kunde_in or Dienstleister. */
function RoleBadge({ className = '' }: { className?: string }) {
  const { role, user, profile } = useAuth()
  if (!role) return null

  const isAdmin = profile?.is_admin ?? false
  const isDriver = role === 'dienstleister'
  const Icon = isAdmin ? ShieldIcon : isDriver ? VanIcon : PersonIcon

  return (
    <span
      className={`role-badge${isDriver || isAdmin ? ' role-badge--driver' : ''} ${className}`.trim()}
    >
      <Icon className="role-badge__icon" />
      {isAdmin
        ? 'Admin'
        : isDriver
          ? 'Dienstleister'
          : user?.is_anonymous
            ? 'Kunde_in · Gast'
            : 'Kunde_in'}
    </span>
  )
}

export default RoleBadge
