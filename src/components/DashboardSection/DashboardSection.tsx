import type { ReactNode } from 'react'
import './DashboardSection.css'

interface DashboardSectionProps {
  title: string
  children: ReactNode
}

function DashboardSection({ title, children }: DashboardSectionProps) {
  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section__title">{title}</h2>
      <div className="dashboard-section__body">{children}</div>
    </section>
  )
}

export default DashboardSection
