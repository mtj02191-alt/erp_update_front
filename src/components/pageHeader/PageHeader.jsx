import { Link } from 'react-router-dom'
import './PageHeader.css'

const WebsitePageHeader = ({ title, image, imageMob, url, onClick }) => {
  const images = (
    <>
      <img
        src={image}
        alt={title}
        className="website-page-header-image website-page-header-image--desktop"
      />
      <img
        src={imageMob || image}
        alt={title}
        className="website-page-header-image website-page-header-image--mobile"
      />
    </>
  )

  return (
    <section className="website-page-header">
      <div className="website-page-header-container">
        <div
          className="website-page-header-image-wrapper"
          onClick={onClick}
          style={onClick ? { cursor: 'pointer' } : undefined}
        >
          {url ? <Link to={url}>{images}</Link> : images}
        </div>
      </div>
    </section>
  )
}

export default WebsitePageHeader
