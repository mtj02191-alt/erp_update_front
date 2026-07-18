import React from 'react'
import './Loader.css'

/**
 * Full-screen loading overlay. Renders nothing when `loading` is false.
 */
function Loader({ loading }) {
  if (!loading) return null

  return (
    <div
      className="loader-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <span className="loader-overlay__spinner" aria-hidden />
    </div>
  )
}

export default Loader
