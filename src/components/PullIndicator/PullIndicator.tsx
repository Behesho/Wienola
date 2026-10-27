import { PULL_THRESHOLD, usePullDistance } from '../../hooks/usePullToRefresh'
import './PullIndicator.css'

/** Small round arrow that follows the finger while pulling down to refresh. */
function PullIndicator() {
  const distance = usePullDistance()
  if (distance <= 0) return null

  const ready = distance >= PULL_THRESHOLD * 0.75
  return (
    <div
      className={`pull-indicator${ready ? ' pull-indicator--ready' : ''}`}
      style={{ transform: `translate(-50%, ${distance}px)` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${ready ? 180 : 0}deg)` }}>
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </svg>
    </div>
  )
}

export default PullIndicator
