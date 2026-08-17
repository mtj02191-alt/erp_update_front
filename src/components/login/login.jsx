import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './login.css';
import {
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiLock,
  FiMail,
  FiShield,
} from 'react-icons/fi';
import mtjfLogo from '../../assets/mtjf_logo.png';
import OfflineModeControls from '../common/OfflineModeControls';
import axiosInstance from '../../utils/axios';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const trimmedFormData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
      };

      const response = await login(trimmedFormData);

      if (response && response.user) {
        navigate('/welcome', { replace: true });
      } else {
        setError('Login successful but user data not found');
      }
    } catch (error) {
      if (!error.response) {
        setError(
          'Unable to reach the server. Check your internet connection and try again.',
        );
      } else if (error.response.status === 401 || error.response.status === 403) {
        setError(error.response?.data?.message || 'Invalid email or password.');
      } else {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const email = formData.email.trim().toLowerCase();
    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      setSuccess(
        res.data?.message ||
          'If an account exists for this email, a new password has been sent.',
      );
    } catch (err) {
      if (!err.response) {
        setError(
          'Unable to reach the server. Check your internet connection and try again.',
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Could not reset password. Please try again later.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src={mtjfLogo} alt="MTJF Logo" />
        </div>
        <h2 className="login-title">MTJF Solutions</h2>
        <p className="login-subtitle">
          {mode === 'forgot'
            ? 'Enter your email to receive a temporary password'
            : 'Sign in to your account'}
        </p>

        <div className="login-divider" aria-hidden>
          <span className="login-divider__line" />
          <FiHeart className="login-divider__icon" />
          <span className="login-divider__line" />
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <label className="login-field">
              <span className="login-field__label">Email</span>
              <div className="login-input-wrap">
                <FiMail className="login-input-icon" aria-hidden />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="login-field">
              <span className="login-field__label">Password</span>
              <div className="login-input-wrap">
                <FiLock className="login-input-icon" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <div className="login-forgot-row">
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setSuccess('');
                }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                'Logging in...'
              ) : (
                <>
                  Login <FiArrowRight aria-hidden />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <label className="login-field">
              <span className="login-field__label">Email</span>
              <div className="login-input-wrap">
                <FiMail className="login-input-icon" aria-hidden />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </label>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send new password'}
            </button>

            <button
              type="button"
              className="login-back-to-login"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
            >
              <FiArrowLeft aria-hidden /> Back to login
            </button>
          </form>
        )}

        <div className="login-offline">
          <OfflineModeControls />
        </div>

        <p className="login-footer">
          <Link to="/privacy-policy">
            <FiShield aria-hidden />
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
