import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function StarRating({ rating, size = 'md', showNumber = true }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const cls = sizes[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= Math.round(rating)
          ? <StarIcon key={star} className={`${cls} text-yellow-400`} />
          : <StarOutline key={star} className={`${cls} text-gray-600`} />
      ))}
      {showNumber && <span className="text-sm text-gray-400 ml-1">{rating?.toFixed(1) || '0.0'}</span>}
    </div>
  );
}
