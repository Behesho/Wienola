import logoIcon from '../../assets/logo-icon.png'
import './BrandLogo.css'

interface BrandLogoProps {
  size?: 'sm' | 'lg'
  showTagline?: boolean
}

function BrandLogo({ size = 'sm', showTagline = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo brand-logo--${size}`}>
      <img src={logoIcon} alt="" className="brand-logo__icon" />
      <div className="brand-logo__text">
        <span className="brand-logo__wordmark">Lasten-Wien</span>
        {showTagline && (
          <span className="brand-logo__tagline">
            Liefer- &amp; Transportservice
          </span>
        )}
      </div>
    </div>
  )
}

export default BrandLogo
