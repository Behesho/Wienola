import { PersonIcon } from '../icons/NavIcons'
import { VanIcon } from '../../pages/Dashboard/NewOrder/icons'
import { useAuth } from '../../context/useAuth'
import './RoleBadge.css'

/** Shows which kind of account is signed in: Kunde_in or Dienstleister. */
function RoleBadge({ className = '' }: { className?: string }) {
  const { role } = useAuth()
  if (!role) return null

  const isDriver = role === 'dienstleister'
  const Icon = isDriver ? VanIcon : PersonIcon

  return (
    <span
      className={`role-badge${isDriver ? ' role-badge--driver' : ''} ${className}`.trim()}
    >
      <Icon className="role-badge__icon" />
      {isDriver ? 'Dienstleister' : 'Kunde_in'}
    </span>
  )
}

export default RoleBadge
