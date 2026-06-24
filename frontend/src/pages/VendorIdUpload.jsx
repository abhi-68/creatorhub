import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ACCEPTED_DOCS = [
  { icon: '🪪', label: 'National ID Card' },
  { icon: '📘', label: 'Passport' },
  { icon: '🚗', label: "Driver's License" },
  { icon: '📋', label: 'Residence Permit' },
];

export default function VendorIdUpload() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploaded, setUploaded] = useState(!!user?.vendorProfile?.idDocument);

  // Already submitted — show pending screen
  if (uploaded || user?.vendorProfile?.idDocument) {
    return <PendingScreen user={user} />;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB');
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Please select a file first');
    const form = new FormData();
    form.append('image', file);
    setUploading(true);
    try {
      await api.post('/upload/id', form);
      const me = await api.get('/auth/me');
      updateUser(me.data);
      setUploaded(true);
      toast.success('ID uploaded successfully! Awaiting verification.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
            <ShieldCheckIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
          <p className="text-gray-400 max-w-sm mx-auto">
            To protect our community, all vendors must verify their identity before accessing the platform.
          </p>
        </div>

        {/* Why required */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-primary-300 mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5" /> Why is this required?
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Protects clients from fake or fraudulent vendors</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Builds trust — you'll get a verified badge on your profile</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Your ID is reviewed only by admins and never shown publicly</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Usually approved within 24 hours</li>
          </ul>
        </div>

        {/* Accepted Documents */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Accepted documents:</p>
          <div className="grid grid-cols-2 gap-2">
            {ACCEPTED_DOCS.map((d) => (
              <div key={d.label} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5">
                <span className="text-xl">{d.icon}</span>
                <span className="text-sm text-gray-300">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-primary-500 rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 group"
        >
          {preview ? (
            <div>
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain mb-3" />
              <p className="text-sm text-gray-400">Click to change</p>
            </div>
          ) : (
            <div>
              <CloudArrowUpIcon className="w-12 h-12 text-gray-600 group-hover:text-primary-400 mx-auto mb-3 transition-colors" />
              <p className="text-white font-medium mb-1">Click to upload your ID</p>
              <p className="text-gray-500 text-sm">JPG, PNG, WEBP · Max 10MB</p>
              <p className="text-gray-600 text-xs mt-2">Make sure all 4 corners are visible and text is readable</p>
            </div>
          )}
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !preview}
          className="btn-primary w-full py-3 text-base disabled:opacity-40"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </span>
          ) : 'Submit for Verification'}
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          By submitting, you confirm this is your own government-issued ID.
        </p>
      </div>
    </div>
  );
}

function PendingScreen({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vp = user?.vendorProfile || {};

  useEffect(() => {
    if (vp.idVerified) navigate('/vendor/dashboard', { replace: true });
  }, [vp.idVerified, navigate]);

  if (vp.idVerified) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Verification Pending</h1>
        <p className="text-gray-400 mb-2">
          Hi <strong className="text-white">{user?.name}</strong>, your ID has been submitted.
        </p>
        <p className="text-gray-400 mb-8">
          Our team will review it and you'll receive an email at <strong className="text-primary-400">{user?.email}</strong> once approved. This usually takes <strong className="text-white">less than 24 hours</strong>.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-300">Account registered</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-300">ID document uploaded</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-yellow-400 flex-shrink-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <span className="text-sm text-gray-300">Admin review <span className="text-yellow-400">(in progress)</span></span>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-500">Full platform access</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary flex-1 text-sm py-2.5">
            Logout
          </button>
          <button onClick={() => window.location.reload()} className="btn-outline flex-1 text-sm py-2.5">
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
}
