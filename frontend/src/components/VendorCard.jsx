import { Link } from 'react-router-dom';
import { MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import StarRating from './StarRating';
import { useAuth } from '../contexts/AuthContext';

const categoryLabels = {
  photographer: '📷 Photographer',
  influencer: '📱 Influencer',
  videographer: '🎬 Videographer',
  graphic_designer: '🎨 Graphic Designer',
  content_creator: '✍️ Content Creator',
  model: '✨ Model',
  makeup_artist: '💄 Makeup Artist',
  other: '🌟 Creator',
};

export default function VendorCard({ vendor }) {
  const { user } = useAuth();
  const vp = vendor.vendorProfile || {};
  const lowestPrice = vp.packages?.length
    ? Math.min(...vp.packages.map((p) => p.price))
    : null;

  return (
    <div className="card group cursor-pointer animate-slide-up">
      <Link to={`/vendors/${vendor._id}`}>
        {/* Cover / Portfolio Preview */}
        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          {vp.portfolio?.[0]?.image ? (
            <img src={vp.portfolio[0].image} alt="portfolio" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{categoryLabels[vp.category]?.split(' ')[0] || '🌟'}</span>
            </div>
          )}
          {vp.featured && (
            <div className="absolute top-3 left-3 badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              ⭐ Featured
            </div>
          )}
          {vp.availability === false && (
            <div className="absolute top-3 right-3 badge bg-red-500/20 text-red-400 border border-red-500/30">
              Unavailable
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {vendor.avatar ? (
                <img src={vendor.avatar} alt={vendor.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/50 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {vendor.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-white truncate">{vendor.name}</h3>
                  {vp.idVerified && <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" title="ID Verified" />}
                </div>
                <p className="text-xs text-primary-400">{categoryLabels[vp.category] || 'Creator'}</p>
              </div>
            </div>
            {lowestPrice !== null && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">from</p>
                <p className="text-sm font-bold text-white">${lowestPrice}</p>
              </div>
            )}
          </div>

          {vp.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <MapPinIcon className="w-3 h-3" />
              <span>{vp.location}</span>
            </div>
          )}

          {vp.bio && (
            <p className="mt-2 text-xs text-gray-400 line-clamp-2">{vp.bio}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <StarRating rating={vp.rating} size="sm" />
            <span className="text-xs text-gray-500">{vp.totalReviews} reviews</span>
          </div>
        </div>
      </Link>

      {user && user._id !== vendor._id && (
        <div className="px-4 pb-4">
          <Link
            to={`/chat/${vendor._id}`}
            className="flex items-center justify-center gap-2 w-full btn-outline text-sm py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Message
          </Link>
        </div>
      )}
    </div>
  );
}
