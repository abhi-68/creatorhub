import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import {
  MapPinIcon, CheckBadgeIcon, GlobeAltIcon, PhoneIcon,
  ChatBubbleLeftRightIcon, StarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/solid';

const categoryLabels = {
  photographer: '📷 Photographer', influencer: '📱 Influencer', videographer: '🎬 Videographer',
  graphic_designer: '🎨 Graphic Designer', content_creator: '✍️ Content Creator',
  model: '✨ Model', makeup_artist: '💄 Makeup Artist', other: '🌟 Creator',
};

export default function VendorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/vendors/${id}`), api.get(`/vendors/${id}/reviews`)])
      .then(([vRes, rRes]) => { setVendor(vRes.data); setReviews(rRes.data); })
      .catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/reviews/${id}`, reviewForm);
      setReviews((prev) => [data, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review submitted!');
      // Refresh vendor rating
      const vRes = await api.get(`/vendors/${id}`);
      setVendor(vRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!vendor) return null;

  const vp = vendor.vendorProfile || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">
        <div className="h-40 bg-gradient-to-r from-primary-900 via-gray-900 to-accent-900" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative">
              {vendor.avatar ? (
                <img src={vendor.avatar} alt={vendor.name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-900" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-3xl font-bold ring-4 ring-gray-900">
                  {vendor.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
                {vp.idVerified && (
                  <span className="flex items-center gap-1 badge bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <CheckBadgeIcon className="w-3 h-3" /> Verified
                  </span>
                )}
                {vp.featured && <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⭐ Featured</span>}
                {vp.availability === false && <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Unavailable</span>}
              </div>
              <p className="text-primary-400 font-medium">{categoryLabels[vp.category] || 'Creator'}</p>
              <div className="flex items-center gap-4 mt-2">
                <StarRating rating={vp.rating} size="md" />
                <span className="text-gray-500 text-sm">({vp.totalReviews} reviews)</span>
                {vp.location && (
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPinIcon className="w-4 h-4" /> {vp.location}
                  </span>
                )}
              </div>
            </div>
            {user && user._id !== vendor._id && (
              <Link to={`/chat/${vendor._id}`} className="btn-primary flex items-center gap-2 sm:self-start mt-2">
                <ChatBubbleLeftRightIcon className="w-4 h-4" /> Message
              </Link>
            )}
          </div>
          {vp.bio && <p className="mt-4 text-gray-300 leading-relaxed">{vp.bio}</p>}

          {/* Social links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {vp.instagram && <a href={`https://instagram.com/${vp.instagram}`} target="_blank" rel="noreferrer" className="badge bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors">📸 @{vp.instagram}</a>}
            {vp.tiktok && <a href={`https://tiktok.com/@${vp.tiktok}`} target="_blank" rel="noreferrer" className="badge bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">🎵 @{vp.tiktok}</a>}
            {vp.youtube && <a href={vp.youtube} target="_blank" rel="noreferrer" className="badge bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">▶ YouTube</a>}
            {vp.website && <a href={vp.website} target="_blank" rel="noreferrer" className="badge bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"><GlobeAltIcon className="w-3 h-3" /> Website</a>}
            {vp.phone && <span className="badge bg-green-500/20 text-green-400 flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {vp.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6">
            {['portfolio', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {tab} {tab === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'portfolio' && (
            vp.portfolio?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {vp.portfolio.map((item, idx) => (
                  <div
                    key={item._id}
                    className="aspect-square rounded-xl overflow-hidden bg-gray-800 group cursor-zoom-in"
                    onClick={() => setLightboxIdx(idx)}
                  >
                    <img src={item.image} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📷</div>
                <p>No portfolio items yet</p>
              </div>
            )
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {user && user.role === 'user' && !reviews.some((r) => r.reviewer?._id === user._id) && (
                <form onSubmit={handleReview} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-white mb-4">Leave a Review</h3>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}>
                        <StarIcon className={`w-7 h-7 transition-colors ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your experience (optional)"
                    className="input resize-none h-24 mb-3"
                  />
                  <button type="submit" disabled={submittingReview} className="btn-primary">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">⭐</div>
                  <p>No reviews yet</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {r.reviewer?.avatar ? (
                        <img src={r.reviewer.avatar} alt={r.reviewer.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-xs font-bold">
                          {r.reviewer?.name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white text-sm">{r.reviewer?.name}</p>
                        <StarRating rating={r.rating} size="sm" showNumber={false} />
                      </div>
                      <span className="ml-auto text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-gray-300 text-sm">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Packages */}
        <div>
          <h2 className="font-semibold text-white mb-4 text-lg">Service Packages</h2>
          {vp.packages?.length ? (
            <div className="space-y-4">
              {vp.packages.map((pkg, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-primary-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{pkg.name}</h3>
                    <span className="text-xl font-bold gradient-text">${pkg.price}</span>
                  </div>
                  {pkg.description && <p className="text-gray-400 text-sm mb-2">{pkg.description}</p>}
                  {pkg.deliveryDays && (
                    <p className="text-xs text-gray-500">⏱ {pkg.deliveryDays} day{pkg.deliveryDays !== 1 ? 's' : ''} delivery</p>
                  )}
                  {user && user._id !== vendor._id && (
                    <Link to={`/chat/${vendor._id}`} className="btn-primary w-full text-center text-sm py-2 mt-3 block">
                      Book This Package
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
              <p className="text-sm">No packages listed yet</p>
            </div>
          )}
        </div>
      </div>
      {/* Portfolio Lightbox */}
      {lightboxIdx !== null && vp.portfolio?.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Prev */}
          {vp.portfolio.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + vp.portfolio.length) % vp.portfolio.length); }}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}
          {/* Image */}
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-3 px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={vp.portfolio[lightboxIdx].image}
              alt={vp.portfolio[lightboxIdx].caption}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            {vp.portfolio[lightboxIdx].caption && (
              <p className="text-gray-300 text-sm text-center">{vp.portfolio[lightboxIdx].caption}</p>
            )}
            <p className="text-gray-600 text-xs">{lightboxIdx + 1} / {vp.portfolio.length}</p>
          </div>
          {/* Next */}
          {vp.portfolio.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % vp.portfolio.length); }}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
