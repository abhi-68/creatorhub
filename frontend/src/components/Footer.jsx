import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CreatorHub</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The platform connecting photographers, influencers, and creatives with clients worldwide. Build your portfolio, set your prices, and grow your brand.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/explore" className="hover:text-primary-400 transition-colors">Explore Creators</Link></li>
              <li><Link to="/register?role=vendor" className="hover:text-primary-400 transition-colors">Become a Vendor</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">Sign Up Free</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {['photographer', 'influencer', 'videographer', 'content_creator', 'model'].map((c) => (
                <li key={c}>
                  <Link to={`/explore?category=${c}`} className="hover:text-primary-400 transition-colors capitalize">
                    {c.replace('_', ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} CreatorHub. All rights reserved.</p>
          <p className="text-gray-600 text-xs">Built for real creators, by creators.</p>
        </div>
      </div>
    </footer>
  );
}
