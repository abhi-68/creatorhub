import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, CloudArrowUpIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import VendorIdUpload from '../VendorIdUpload';

const categories = [
  { value: 'photographer', label: '📷 Photographer' }, { value: 'influencer', label: '📱 Influencer' },
  { value: 'videographer', label: '🎬 Videographer' }, { value: 'graphic_designer', label: '🎨 Graphic Designer' },
  { value: 'content_creator', label: '✍️ Content Creator' }, { value: 'model', label: '✨ Model' },
  { value: 'makeup_artist', label: '💄 Makeup Artist' }, { value: 'other', label: '🌟 Other' },
];

export default function VendorDashboard() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const vp = user?.vendorProfile || {};

  // Gate 1: No ID uploaded yet → show upload page
  if (!vp.idDocument) {
    return <VendorIdUpload />;
  }

  // Gate 2: ID uploaded but not yet verified → show pending screen
  if (!vp.idVerified) {
    return <VendorIdUpload />;
  }

  // Gate 3: Full dashboard access
  return <VendorDashboardFull user={user} updateUser={updateUser} logout={logout} navigate={navigate} />;
}

function VendorDashboardFull({ user, updateUser, logout, navigate }) {
  const vp = user?.vendorProfile || {};
  const [tab, setTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/account');
      logout();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setDeleting(false);
    }
  };
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    category: vp.category || '',
    bio: vp.bio || '',
    location: vp.location || '',
    instagram: vp.instagram || '',
    tiktok: vp.tiktok || '',
    youtube: vp.youtube || '',
    website: vp.website || '',
    phone: vp.phone || '',
    availability: vp.availability !== false,
  });
  const [packages, setPackages] = useState(vp.packages || []);
  const [newPkg, setNewPkg] = useState({ name: '', description: '', price: '', deliveryDays: '' });
  const [editingIdx, setEditingIdx] = useState(null);
  const [editPkg, setEditPkg] = useState({});
  const [resending, setResending] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const portfolioRef = useRef();
  const idRef = useRef();
  const avatarRef = useRef();

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/vendors/profile', { ...profile, packages });
      updateUser(data);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      toast.success('Verification email sent! Check your inbox.');
    } catch { toast.error('Failed to send'); }
    finally { setResending(false); }
  };

  const handleAddPackage = () => {
    if (!newPkg.name || !newPkg.price) return toast.error('Package name and price required');
    setPackages((prev) => [...prev, { ...newPkg, price: Number(newPkg.price), deliveryDays: Number(newPkg.deliveryDays) || undefined }]);
    setNewPkg({ name: '', description: '', price: '', deliveryDays: '' });
  };

  const startEditPkg = (idx) => { setEditingIdx(idx); setEditPkg({ ...packages[idx] }); };
  const cancelEditPkg = () => setEditingIdx(null);
  const saveEditPkg = () => {
    if (!editPkg.name || !editPkg.price) return toast.error('Name and price required');
    setPackages((prev) => prev.map((p, i) => i === editingIdx ? { ...editPkg, price: Number(editPkg.price), deliveryDays: Number(editPkg.deliveryDays) || undefined } : p));
    setEditingIdx(null);
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    setUploadingPortfolio(true);
    try {
      const { data } = await api.post('/upload/portfolio', form);
      await api.post('/vendors/portfolio', { image: data.url, caption: '' });
      const res = await api.get('/auth/me');
      updateUser(res.data);
      toast.success('Portfolio image uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingPortfolio(false); }
  };

  const handleDeletePortfolio = async (itemId) => {
    try {
      const { data } = await api.delete(`/vendors/portfolio/${itemId}`);
      updateUser(data);
      toast.success('Removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    setUploadingId(true);
    try {
      await api.post('/upload/id', form);
      toast.success('ID uploaded! Awaiting admin verification.');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingId(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    try {
      const { data } = await api.post('/upload/avatar', form);
      const me = await api.get('/auth/me');
      updateUser(me.data);
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Vendor Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your profile, portfolio & packages</p>
        </div>
        {vp.idVerified ? (
          <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 self-start">✅ ID Verified</span>
        ) : (
          <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 self-start">⏳ ID Pending</span>
        )}
      </div>

      {!user?.isVerified && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-yellow-400 font-semibold">⚠️ Verify your email to appear in search results</p>
          <button onClick={handleResendVerification} disabled={resending} className="text-sm text-yellow-300 underline underline-offset-2 hover:text-yellow-200 disabled:opacity-50 whitespace-nowrap">
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-8 overflow-x-auto">
        {['profile', 'portfolio', 'packages', 'id'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'id' ? '🪪 ID Verify' : t === 'portfolio' ? '📷 Portfolio' : t === 'packages' ? '💼 Packages' : '👤 Profile'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-2xl font-bold">
                  {user?.name?.[0]}
                </div>
              )}
              <input type="file" ref={avatarRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button onClick={() => avatarRef.current?.click()} className="btn-secondary text-sm">Change Photo</button>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-white">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select className="input" value={profile.category} onChange={(e) => setProfile((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input className="input" placeholder="City, Country" value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input className="input" placeholder="+1 234 567 8900" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea className="input resize-none h-28" placeholder="Tell clients about yourself, your style, experience..." value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instagram username</label>
                <input className="input" placeholder="yourusername" value={profile.instagram} onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">TikTok username</label>
                <input className="input" placeholder="yourusername" value={profile.tiktok} onChange={(e) => setProfile((p) => ({ ...p, tiktok: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">YouTube URL</label>
                <input className="input" placeholder="https://youtube.com/..." value={profile.youtube} onChange={(e) => setProfile((p) => ({ ...p, youtube: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Website</label>
                <input className="input" placeholder="https://yoursite.com" value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="avail" checked={profile.availability} onChange={(e) => setProfile((p) => ({ ...p, availability: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
              <label htmlFor="avail" className="text-sm text-gray-300">Available for bookings</label>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {tab === 'portfolio' && (
        <div>
          <input type="file" ref={portfolioRef} accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
          <button onClick={() => portfolioRef.current?.click()} disabled={uploadingPortfolio} className="btn-primary mb-6 flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5" />
            {uploadingPortfolio ? 'Uploading...' : 'Upload Image'}
          </button>
          {vp.portfolio?.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">📷</div>
              <p>No portfolio images yet. Upload your best work!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {vp.portfolio?.map((item) => (
                <div key={item._id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800">
                  <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeletePortfolio(item._id)} className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Add Package</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Package Name *</label>
                <input className="input" placeholder="e.g. Basic Shoot" value={newPkg.name} onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price (USD) *</label>
                <input type="number" className="input" placeholder="150" value={newPkg.price} onChange={(e) => setNewPkg((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input className="input" placeholder="What's included" value={newPkg.description} onChange={(e) => setNewPkg((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Delivery (days)</label>
                <input type="number" className="input" placeholder="3" value={newPkg.deliveryDays} onChange={(e) => setNewPkg((p) => ({ ...p, deliveryDays: e.target.value }))} />
              </div>
            </div>
            <button onClick={handleAddPackage} className="btn-secondary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Add Package
            </button>
          </div>

          <div className="space-y-3">
            {packages.map((pkg, i) => (
              <div key={i} className="card p-4">
                {editingIdx === i ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Name *</label>
                        <input className="input" value={editPkg.name} onChange={(e) => setEditPkg((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Price (USD) *</label>
                        <input type="number" className="input" value={editPkg.price} onChange={(e) => setEditPkg((p) => ({ ...p, price: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Description</label>
                        <input className="input" value={editPkg.description || ''} onChange={(e) => setEditPkg((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Delivery (days)</label>
                        <input type="number" className="input" value={editPkg.deliveryDays || ''} onChange={(e) => setEditPkg((p) => ({ ...p, deliveryDays: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEditPkg} className="btn-primary text-sm py-1.5 flex items-center gap-1"><CheckIcon className="w-4 h-4" /> Save</button>
                      <button onClick={cancelEditPkg} className="btn-secondary text-sm py-1.5 flex items-center gap-1"><XMarkIcon className="w-4 h-4" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{pkg.name}</p>
                      {pkg.description && <p className="text-gray-400 text-sm">{pkg.description}</p>}
                      {pkg.deliveryDays && <p className="text-gray-500 text-xs mt-1">⏱ {pkg.deliveryDays} days</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xl font-bold gradient-text">${pkg.price}</span>
                      <button onClick={() => startEditPkg(i)} className="text-gray-400 hover:text-white transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPackages((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {packages.length > 0 && (
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Packages'}
            </button>
          )}
        </div>
      )}

      {/* Danger Zone — shown on all tabs at bottom */}
      <div className="border border-red-500/30 rounded-2xl p-6 mt-8">
        <h2 className="font-semibold text-red-400 text-lg mb-1">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">Permanently delete your vendor account, portfolio, packages, messages and reviews. This cannot be undone.</p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-5 py-2 rounded-xl transition-all text-sm">
            🗑 Delete My Account
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 font-medium mb-3">Are you absolutely sure? Your profile, portfolio, packages, messages and reviews will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl transition-all text-sm disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm py-2">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ID Verification Tab */}
      {tab === 'id' && (
        <div className="card p-6 max-w-lg">
          <h3 className="font-semibold text-white text-lg mb-2">ID Verification</h3>
          <p className="text-gray-400 text-sm mb-6">Upload a government-issued ID (passport, driver's license, etc.). Your ID will be reviewed by an admin and never shown publicly. A verified badge builds trust with clients.</p>
          {vp.idVerified ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-green-400 font-semibold">ID Verified</p>
              <p className="text-gray-400 text-sm">Your profile shows a verified badge</p>
            </div>
          ) : vp.idDocument ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-yellow-400 font-semibold">Under Review</p>
              <p className="text-gray-400 text-sm">Your ID has been submitted and is pending admin verification</p>
            </div>
          ) : (
            <div>
              <input type="file" ref={idRef} accept="image/*" className="hidden" onChange={handleIdUpload} />
              <button onClick={() => idRef.current?.click()} disabled={uploadingId} className="btn-primary flex items-center gap-2">
                <CloudArrowUpIcon className="w-5 h-5" />
                {uploadingId ? 'Uploading...' : 'Upload ID Document'}
              </button>
              <p className="text-gray-500 text-xs mt-3">Accepted: JPG, PNG, WEBP. Max 10MB.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
