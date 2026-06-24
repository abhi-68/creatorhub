import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import VendorCard from '../components/VendorCard';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const categories = [
  { value: 'photographer', label: 'Photographers', icon: '📷', desc: 'Professional shoots & events' },
  { value: 'influencer', label: 'Influencers', icon: '📱', desc: 'Brand deals & promotions' },
  { value: 'videographer', label: 'Videographers', icon: '🎬', desc: 'Video content & reels' },
  { value: 'graphic_designer', label: 'Designers', icon: '🎨', desc: 'Logos, branding & more' },
  { value: 'content_creator', label: 'Content Creators', icon: '✍️', desc: 'Social & blog content' },
  { value: 'model', label: 'Models', icon: '✨', desc: 'Fashion & commercial' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendors/featured')
      .then((res) => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/40 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-2 text-sm text-primary-400 mb-6">
            <SparklesIcon className="w-4 h-4" /> The platform for creatives
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Discover Amazing<br />
            <span className="gradient-text">Creators</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with photographers, influencers, videographers and more. Browse portfolios, compare prices, and hire the perfect creator for your vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/explore" className="btn-primary text-lg py-3 px-8 flex items-center gap-2 justify-center">
              Explore Creators <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link to="/register?role=vendor" className="btn-outline text-lg py-3 px-8">
              Join as Vendor
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-16">
            {[['500+', 'Creators'], ['1000+', 'Clients'], ['5★', 'Avg Rating']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{num}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Browse by Category</h2>
            <p className="text-gray-400">Find the right creative for every project</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link
                key={c.value}
                to={`/explore?category=${c.value}`}
                className="card p-5 text-center group hover:scale-[1.03] transition-transform"
              >
                <div className="text-4xl mb-3">{c.icon}</div>
                <p className="font-medium text-white text-sm group-hover:text-primary-400 transition-colors">{c.label}</p>
                <p className="text-gray-500 text-xs mt-1">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title mb-2">⭐ Featured Creators</h2>
              <p className="text-gray-400">Handpicked top talent on the platform</p>
            </div>
            <Link to="/explore" className="btn-secondary hidden sm:flex items-center gap-2 text-sm">
              View All <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card h-72 animate-pulse bg-gray-800" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((v) => <VendorCard key={v._id} vendor={v} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured creators yet. <Link to="/explore" className="text-primary-400 hover:underline">Browse all creators →</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-900/50 to-accent-900/50 border border-primary-500/30 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 text-lg mb-8">Join thousands of creators and clients building amazing things together.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg py-3 px-8">Create Free Account</Link>
              <Link to="/explore" className="btn-secondary text-lg py-3 px-8">Browse Creators</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
