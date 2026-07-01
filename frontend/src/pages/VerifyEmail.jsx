import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) return toast.error('Please enter all 6 digits');
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.post('/auth/verify-code', { email, code });
      setStatus('success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed';
      setErrorMsg(msg);
      setStatus('error');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const handleResend = async () => {
    if (!email) return toast.error('Email address missing — go back and register again');
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('New code sent! Check your inbox.');
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      setErrorMsg('');
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-gray-400 mb-6">Your account is now active. You can sign in.</p>
          <Link to="/login" className="btn-primary">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          {email ? (
            <p className="text-gray-400 mt-2">
              We sent a 6-digit code to <span className="text-primary-400 font-medium">{email}</span>
            </p>
          ) : (
            <p className="text-gray-400 mt-2">Enter the 6-digit code from your email</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-gray-800 text-white outline-none transition-all
                  ${d ? 'border-primary-500' : 'border-gray-700'}
                  focus:border-primary-400`}
              />
            ))}
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm text-center mb-4">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full py-3 text-base"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Verify Email'}
          </button>

          <div className="text-center mt-5">
            <span className="text-gray-400 text-sm">Didn&apos;t receive a code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Wrong account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300">Register again</Link>
        </p>
      </div>
    </div>
  );
}
