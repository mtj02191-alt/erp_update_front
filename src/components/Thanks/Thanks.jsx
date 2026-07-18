import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../pageHeader/PageHeader'
import image from '../../assets/img/thanks/thanks.webp'
import Footer from '../footer/Footer'
import axiosInstance from '../../utils/axios'

const Thanks = () => {
  const [searchParams] = useSearchParams()
  const donationId = searchParams.get('donationId')
  const urlStatus = searchParams.get('status') // success, failed, pending
  const [donationStatus, setDonationStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (donationId) {
      verifyDonationStatus()
    } else {
      setLoading(false)
      setError('Donation ID not found in URL')
    }
  }, [donationId])

  const verifyDonationStatus = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Call status-only API to verify with Meezan (real-time status)
      const response = await axiosInstance.get('/donations/public/meezan/status-only', {
        params: { donationId: donationId }
      })

      if (response.data.success) {
        const status = response.data.data?.status || urlStatus || 'pending'
        setDonationStatus(status)
      } else {
        setError(response.data.message || 'Failed to verify donation status')
        setDonationStatus(urlStatus || 'pending')
      }
    } catch (err) {
      console.error('Error verifying donation status:', err)
      setError(err.response?.data?.message || 'Failed to verify donation status')
      // Fallback to URL status if API fails
      setDonationStatus(urlStatus || 'pending')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = () => {
    const status = donationStatus || urlStatus || 'pending'
    
    switch (status) {
      case 'completed':
      case 'success':
        return {
          title: 'Thank You!',
          message: 'Your donation has been successfully processed.',
          icon: '✅',
          color: '#10b981'
        }
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Unfortunately, your payment could not be processed. Please try again.',
          icon: '❌',
          color: '#ef4444'
        }
      case 'pending':
      case 'registered':
      default:
        return {
          title: 'Payment Pending',
          message: 'Your payment is being processed. Please wait a moment and refresh this page.',
          icon: '⏳',
          color: '#f59e0b'
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <>
      <PageHeader
        // title="Thanks"
        image={image}
      />
      
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {loading ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2>Verifying your donation...</h2>
            <p>Please wait while we confirm your payment status.</p>
          </div>
        ) : error && !donationStatus ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2>Verification Error</h2>
            <p style={{ color: '#ef4444' }}>{error}</p>
            {donationId && (
              <button
                onClick={verifyDonationStatus}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry Verification
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {statusInfo.icon}
            </div>
            <h1 style={{ 
              color: statusInfo.color,
              marginBottom: '1rem',
              fontSize: '2.5rem'
            }}>
              {statusInfo.title}
            </h1>
            <p style={{ 
              fontSize: '1.2rem',
              color: '#6b7280',
              marginBottom: '2rem',
              maxWidth: '600px'
            }}>
              {statusInfo.message}
            </p>
            
            {donationId && (
              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#6b7280'
              }}>
                Donation ID: <strong>{donationId}</strong>
              </div>
            )}

            {(donationStatus === 'pending' || donationStatus === 'registered') && (
              <button
                onClick={verifyDonationStatus}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Refresh Status
              </button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}

export default Thanks
