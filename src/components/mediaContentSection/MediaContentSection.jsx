import React, { Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import LazyImage from '../common/LazyImage'
import BrandArea from '../brands/brands'
import './MediaContentSection.css'
import PageHeader from '../pageHeader/PageHeader'
const ProjectsTestimonial = lazy(() => import('../projectsTestimonial/ProjectsTestimonial'))

const MediaContentSection = ({ subProjects, defaultImage, projectKey }) => {
  const navigate = useNavigate()

  // Function to handle donate button click
  const handleDonateClick = (donationUrl, openInNewTab = false) => {
    if (donationUrl && openInNewTab) {
      window.open(donationUrl, '_blank', 'noopener,noreferrer')
      return
    }

    // If donationUrl exists, navigate to that page
    if (donationUrl) {
      navigate(donationUrl)
      return
    }
    
    // Otherwise, scroll to the donation form on the page
    setTimeout(() => {
      let donationForm = document.querySelector('.vertical-donation-form')
      if (!donationForm) {
        donationForm = document.querySelector('.donation-form')
      }
      if (donationForm) {
        donationForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Focus on the first input field in the form
        const firstInput = donationForm.querySelector('input, select, button')
        if (firstInput) {
          firstInput.focus()
        }
      }
    }, 100)
  }

  // Helper function to get list items from sub-project
  const getListItems = (subProject) => {
    // Check for common list fields in order of priority
    if (subProject.services) return subProject.services
    if (subProject.benefits) return subProject.benefits
    if (subProject.programs) return subProject.programs
    if (subProject.workflow) return subProject.workflow
    if (subProject.reportIncludes) return subProject.reportIncludes
    if (subProject.points) return subProject.points
    if (subProject.interventions && Array.isArray(subProject.interventions)) return subProject.interventions
    if (subProject.support) return subProject.support
    if (subProject.response) return subProject.response
    if (subProject.faqs) return subProject.faqs
    if (subProject.programs && Array.isArray(subProject.programs) && subProject.programs[0]?.title) {
      // Handle nested programs structure (like clean-water)
      return subProject.programs.map(p => p.title)
    }
    return null
  }

  // Helper function to get image for sub-project
  const getSubProjectImage = (subProject) => {
    // Use default image for now, can be extended to use subProject.image if added later
    return subProject?.image
  }

  const getItemField = (item, keys = []) => {
    if (!item || typeof item !== 'object') return ''
    for (const key of keys) {
      const value = item[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  }

  const getSubServiceItems = (item) => {
    if (!item || typeof item !== 'object') return []
    const nested = item.subServices || item.subservices || item.items || item.points || item.services
    if (!Array.isArray(nested)) return []
    return nested
      .map((subItem) => {
        if (typeof subItem === 'string') {
          return {
            bold: '',
            text: subItem.trim()
          }
        }
        if (!subItem || typeof subItem !== 'object') return null

        const bold = getItemField(subItem, ['boldText', 'bold', 'heading', 'title', 'name', 'label'])
        const text = getItemField(subItem, ['text', 'description', 'subtitle', 'answer'])

        if (!bold && !text) {
          const fallback = Object.values(subItem).find((value) => typeof value === 'string' && value.trim())
          return {
            bold: '',
            text: typeof fallback === 'string' ? fallback.trim() : ''
          }
        }

        return { bold, text }
      })
      .filter((entry) => entry && (entry.bold || entry.text))
  }

  const renderTextWithBoldMarkers = (value) => {
    if (typeof value !== 'string' || !value) return null
    const parts = value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)

    return parts.map((part, index) => {
      const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4
      if (isBold) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <React.Fragment key={index}>{part}</React.Fragment>
    })
  }

  const normalizeListItem = (item) => {
    if (typeof item === 'string') {
      return {
        heading: '',
        textBold: '',
        text: item,
        subServices: [],
        forceBold: false
      }
    }

    if (!item || typeof item !== 'object') {
      return {
        heading: '',
        textBold: '',
        text: '',
        subServices: [],
        forceBold: false
      }
    }

    const heading = getItemField(item, ['heading', 'title', 'name', 'label', 'question'])
    const textBold = getItemField(item, ['boldText', 'bold', 'descriptionBold', 'textBold'])
    const text = getItemField(item, ['description', 'text', 'subtitle', 'answer'])
    const subServices = getSubServiceItems(item)
    const forceBold = item.bold === true || item.forceBold === true || item.allBold === true || item.isBold === true

    // Fallback for objects that only expose an unknown first string value.
    if (!heading && !textBold && !text && subServices.length === 0) {
      const fallback = Object.values(item).find((value) => typeof value === 'string' && value.trim())
      return {
        heading: '',
        textBold: '',
        text: typeof fallback === 'string' ? fallback.trim() : '',
        subServices: [],
        forceBold
      }
    }

    return { heading, textBold, text, subServices, forceBold }
  }

  if (!subProjects || subProjects.length === 0) {
    return null
  }

  return (
    <section className="media-content-section">
      {subProjects.map((subProject, index) => {
        const listItems = getListItems(subProject)
        const image = getSubProjectImage(subProject)
        const isEven = index % 2 === 0
        const imagePosition = isEven ? 'right' : 'left'

        return (
          <div key={subProject.id || index} className="media-content-item"> 
            <div className={`media-content-wrapper container ${(image || subProject.video) ? imagePosition : 'no-image'}`}>
              {/* Content Side */}
              <div className="media-content-text">

                <h2 className="media-content-heading">{subProject.title}</h2>
                {subProject.subtitle && (
                  <p className="media-content-subtitle">{subProject.subtitle}</p>
                )}
                {subProject?.impact && (
                  <h3 className='m-0'>{subProject.impact}</h3>
                )}
                {subProject.description && (<>
                  {subProject?.descriptionBold && <b>{subProject?.descriptionBold || ''}</b>}
                  <p className="media-content-description"> {subProject?.description?.length > 700 ? subProject.description.slice(0, 600) + '...' : subProject.description} </p>
                  </>
                )} 
              {subProject.description2 && (<>
                {subProject?.description2Bold && <b>{subProject?.description2Bold || ''}</b>}
                  <p className="media-content-description"> {subProject.description2} </p>
                </>
                )} 
                {subProject.description3 && (<>
                  {subProject?.description3Bold && <b>{subProject?.description3Bold || ''}</b>}
                  <p className="media-content-description"> {subProject.description3} </p>
                </>
                )} 
                {listItems && listItems.length > 0 && (
                  <ul className="media-content-list">
                    {listItems.map((item, itemIndex) => {
                      const normalizedItem = normalizeListItem(item)
                      if (!normalizedItem.heading && !normalizedItem.textBold && !normalizedItem.text && normalizedItem.subServices.length === 0) {
                        return null
                      }

                      return (
                        <li key={itemIndex} className="media-content-list-item">
                          <span className="media-content-list-icon"></span>
                          <div className="media-content-list-content">
                            {normalizedItem.heading && (
                              <span className="media-content-list-heading">{normalizedItem.heading}</span>
                            )}
                            {(normalizedItem.textBold || normalizedItem.text) && (
                              <span className="media-content-list-text">
                                {normalizedItem.textBold && (
                                  <strong className="media-content-list-inline-strong">
                                    {normalizedItem.textBold}
                                  </strong>
                                )}
                                {normalizedItem.textBold && normalizedItem.text ? ' ' : ''}
                                {normalizedItem.forceBold ? (
                                  <strong>{renderTextWithBoldMarkers(normalizedItem.text)}</strong>
                                ) : (
                                  renderTextWithBoldMarkers(normalizedItem.text)
                                )}
                              </span>
                            )}
                            {normalizedItem.subServices.length > 0 && (
                              <ul className="media-content-sub-list">
                                {normalizedItem.subServices.map((subService, subIndex) => (
                                  <li key={`${itemIndex}-${subIndex}`} className="media-content-sub-list-item">
                                    {subService.bold && (
                                      <strong className="media-content-list-inline-strong">
                                        {subService.bold}
                                      </strong>
                                    )}
                                    {subService.bold && subService.text ? ' ' : ''}
                                    {renderTextWithBoldMarkers(subService.text)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {subProject.afterServicesText && (
                  <p className="media-content-description">{subProject.afterServicesText}</p>
                )}

                {/* Arabic Text */}
                {subProject.arabicText && (
                  <p className="media-content-arabic-text">{subProject.arabicText}</p>
                )}

                {/* Quran Ayat / Hadith Section */}
                {subProject.quranAyat?.text && (
                  <div className="media-content-quran-ayat">
                    <p className="media-content-quran-ayat__text">
                      {subProject.quranAyat.text.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < subProject.quranAyat.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                    <span className="media-content-quran-ayat__reference">{subProject.quranAyat.reference}</span>
                  </div>
                )}

                {/* Text that should appear after the Hadith/Quran block */}
                {subProject.afterHadithText && (
                  <p className="media-content-description">{subProject.afterHadithText}</p>
                )}

                {/* Render CTA buttons - handles both single and multiple buttons */}
                {(() => {
                  // Check if donateButtonText exists and is not empty
                  if (!subProject.donateButtonText) return null
                  
                  // Normalize to array format
                  const buttons = Array.isArray(subProject.donateButtonText) 
                    ? subProject.donateButtonText 
                    : [subProject.donateButtonText]
                  
                  // Filter out empty strings
                  const validButtons = buttons.filter(btn => btn && btn.trim() !== '')
                  if (validButtons.length === 0) return null

                  // Get corresponding URLs and openInNewTab settings
                  const urls = Array.isArray(subProject.donationUrl) 
                    ? subProject.donationUrl 
                    : [subProject.donationUrl]
                  
                  const openInNewTabs = Array.isArray(subProject.openInNewTab) 
                    ? subProject.openInNewTab 
                    : [subProject.openInNewTab]

                  return (
                    <div className="media-content-cta-wrapper">
                      {subProject.readFullNewsText && (
                        <span className="media-content-cta-text">{subProject.readFullNewsText}</span>
                      )}
                      <div className="media-content-cta-buttons">
                        {validButtons.map((btnText, index) => {
                          const url = urls[index] || urls[0] || ''
                          const openInNewTab = openInNewTabs[index] !== undefined ? openInNewTabs[index] : (openInNewTabs[0] || false)
                          
                          return (
                            <button
                              key={index}
                              className="media-content-cta btn btn--primary"
                              onClick={() => handleDonateClick(url, openInNewTab)}
                            >
                              {btnText}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Video or Image Side */}
              {subProject.video ? (
                <div className="media-content-image">
                  <div className="media-content-video-wrapper">
                    {subProject.video.includes('youtube.com') || subProject.video.includes('youtu.be') ? (
                      <iframe
                        src={`${subProject.video.replace('watch?v=', 'embed/').split('&')[0]}`}
                        title={subProject.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={subProject.video}
                        preload="metadata"
                        playsInline
                        controls
                        className="media-content-video-element"
                      />
                    )}
                  </div>
                </div>
              ) : image ? (
                <div className="media-content-image">
                  {subProject.imageMob ? (
                    <>
                      <LazyImage
                        src={image}
                        alt={subProject.title}
                        className="media-content-image-img d-none md:d-block"
                      />
                      <LazyImage
                        src={subProject.imageMob}
                        alt={subProject.title}
                        className="media-content-image-img sm:d-block md:d-none"
                      />
                    </>
                  ) : (
                    <LazyImage
                      src={image}
                      alt={subProject.title}
                      className="media-content-image-img"
                    />
                  )}
                </div>
              ) : null}

              {/* Bottom Paragraph - appears below both image and text */}
              {/* BottomText Bold */}
              {(subProject?.bottomTextBold) && (
               <p><b>{subProject?.bottomTextBold || ''}</b></p>
              )}

              {/* Bottom Text Sub Title */}
              {(subProject?.bottomTextSubTitle) && (
                  <p>
                    {subProject?.bottomTextSubTitle || ''}
                  </p>
              )}
              {(subProject.bottomText || subProject.footerText || subProject.conclusion || subProject.summary) && (
                <div className="media-content-bottom-text">
                  <p className="media-content-bottom-paragraph">
                    {subProject.bottomText || subProject.footerText || subProject.conclusion || subProject.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Carousel Images */}
            {subProject.carosellImages && subProject.carosellImages.length > 0 && (
              <BrandArea
                brands={subProject.carosellImages.map((img, i) => ({
                  image: img,
                  link: '',
                  alt: `${subProject.title} image ${i + 1}`
                }))}
                title=""
                speed={500}
                itemWidth={subProject.carosellItemWidth}
                mobWidth={subProject.carosellMobWidth}
              />
            )}

            {/* Testimonials Section */}
            {subProject?.testimonials && (
              <div className={subProject.testimonials.mobileOnly ? 'testimonials-mobile-only' : ''}>
                <Suspense fallback={null}>
                  <ProjectsTestimonial
                    videos={subProject.testimonials.videos}
                    title={subProject.testimonials.title}
                    subtitle={subProject.testimonials.subtitle}
                  />
                </Suspense>
              </div>
            )}

              {/* Banner Image  if there is botton_banner_img and bottom_banner_mobile_img  use PageHeader Component */}
              {subProject.bottom_banner_img && subProject.bottom_banner_mobile_img && (<>
                <div className='banner_img d-none md:d-block'>
                  <PageHeader
                  title={subProject.title}
                  image={subProject.bottom_banner_img}
                />
                </div>
                <div className='banner_img--mobile sm:d-block md:d-none'>
                  <img src={subProject.bottom_banner_mobile_img} alt={subProject.title} />
                </div>
                </>)}
          </div>
        )
      })}

      {/* Newsletter, Donation CTA, and Footer Sections */}
      {/* <Newsletter />
      <DonationCta />
      <Footer /> */}
    </section>
  )
}

export default MediaContentSection
