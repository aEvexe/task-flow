import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendCode } from '../api/auth';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const returnedEmail = await register(name, email, password);
      setRegisteredEmail(returnedEmail);
      setStep('otp');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message?: string } } }).response?.data?.message || 'Registration failed'
          : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(registeredEmail, otp);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message?: string } } }).response?.data?.message || 'Verification failed'
          : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await resendCode(registeredEmail);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message?: string } } }).response?.data?.message || 'Failed to resend code'
          : 'Failed to resend code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = otp.split('');
    newOtp[index] = value;
    const joined = newOtp.join('').slice(0, 6);
    setOtp(joined);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted);
    const lastInput = document.getElementById(`otp-${Math.min(pasted.length, 5)}`);
    lastInput?.focus();
  };

  if (step === 'otp') {
    return (
      <div className="auth-page">
        <div className="auth-card otp-card">
          <div className="otp-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc4c3e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </div>
          <h2 className="otp-heading">Check your email</h2>
          <p className="otp-description">
            We sent a 6-digit code to<br /><strong>{registeredEmail}</strong>
          </p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-boxes" onPaste={handleOtpPaste}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="otp-box"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
          <div className="otp-actions">
            <button type="button" className="btn-link" onClick={handleResend} disabled={loading}>
              Resend code
            </button>
            <span className="otp-divider-dot" />
            <button type="button" className="btn-link" onClick={() => { setStep('form'); setOtp(''); setError(''); }}>
              Change email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">TaskFlow</h1>
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending code...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleLoginButton />
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
