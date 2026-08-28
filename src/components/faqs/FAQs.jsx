import React, { useState } from 'react'
import './FAQs.css'

const FAQs = ({ title, subtitle, faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null)

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <section className="faqs-section container py-48">
      {(title || subtitle) && (
        <div className="faqs-header text-center">
          {title && <h2 className="heading-secondary mb-16">{title}</h2>}
          {subtitle && <p className="faqs-subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="faqs-container">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const question = typeof faq === 'object' ? faq.question : faq
          const answer = typeof faq === 'object' ? faq.answer : ''

          return (
            <div key={index} className="faqs-item">
              <button
                className={`faqs-question ${isOpen ? 'open' : ''}`}
                onClick={() => handleToggle(index)}
                aria-expanded={isOpen}
                type="button"
              >
                <span className="faqs-chevron">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="faqs-question-text">{question}</span>
              </button>

              {isOpen && (
                <div className="faqs-answer">
                  <div className="faqs-answer-content">
                    {typeof answer === 'string' ? (
                      <p>{answer}</p>
                    ) : (
                      answer
                    )}
                  </div>
                </div>
              )}

              {index < faqs.length - 1 && <div className="faqs-divider"></div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FAQs

