import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import VendorCard from '../components/VendorCard';
import { ArrowRightIcon, SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const categories = [
  { value: 'photographer', label: 'Photographers', icon: '📷', desc: 'Professional shoots & events' },
  { value: 'influencer', label: 'Influencers', icon: '📱', desc: 'Brand deals & promotions' },
  { value: 'videographer', label: 'Videographers', icon: '🎬', desc: 'Video content & reels' },
  { value: 'graphic_designer', label: 'Designers', icon: '🎨', desc: 'Logos, branding & more' },
  { value: 'content_creator', label: 'Content Creators', icon: '✍️', desc: 'Social & blog content' },
  { value: 'model', label: 'Models', icon: '✨', desc: 'Fashion & commercial' },
  { value: 'makeup_artist', label: 'Makeup Artists', icon: '💄', desc: 'Beauty & editorial' },
  { value: 'other', label: 'Other Creators', icon: '🌟', desc: 'Unique creative talent' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Browse Creators', desc: 'Explore verified creators by category, portfolio quality, and starting price. Every profile is ID-checked.' },
  { step: '02', icon: '💬', title: 'Message Directly', desc: 'Chat in real time with creators, share your brief, and discuss deliverables — no middleman, no markup.' },
  { step: '03', icon: '✅', title: 'Hire & Create', desc: 'Agree on scope, book your creator, and receive amazing content. Leave a review to help others find great talent.' },
];

const BENEFITS = [
  { icon: '🛡️', title: 'Every Creator ID Verified', desc: 'Government ID checked before listing. You know exactly who you\'re hiring.' },
  { icon: '💬', title: 'Real-Time Messaging', desc: 'Instant chat built in. Discuss, negotiate, and collaborate without leaving the platform.' },
  { icon: '⭐', title: 'Genuine Reviews', desc: 'Ratings from real clients who\'ve hired these creators — no fake reviews, ever.' },
  { icon: '🎯', title: 'Creative Specialists', desc: 'Not a generalist marketplace. Every creator here is focused on visual content and media.' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/vendors/featured')
      .then((res) => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) navigate(`/explore?search=${encodeURIComponent(heroSearch.trim())}`);
    else navigate('/explore');
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/40 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-2 text-sm text-primary-400 mb-6">
            <SparklesIcon className="w-4 h-4" /> The platform for creatives
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Find Your Perfect<br />
            <span className="gradient-text">Creative Partner</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connect with verified photographers, influencers, videographers and more. Browse real portfolios, compare packages, and hire with confidence.
          </p>

          {/* Hero search bar — Fiverr-style prominent search */}
          <form onSubmit={handleHeroSearch} className="flex max-w-2xl mx-auto mb-6 shadow-2xl shadow-primary-900/30">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder='Try "wedding photographer" or "logo designer"...'
                className="w-full bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 pl-12 pr-4 py-4 rounded-l-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-4 rounded-r-xl transition-colors whitespace-nowrap">
              Search
            </button>
          </form>

          {/* Quick-link pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['📷 Photographers', '🎬 Videographers', '📱 Influencers', '🎨 Designers'].map((label) => {
              const cat = label.includes('Photo') ? 'photographer' : label.includes('Video') ? 'videographer' : label.includes('Influ') ? 'influencer' : 'graphic_designer';
              return (
                <Link key={label} to={`/explore?category=${cat}`} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-full text-sm transition-all">
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12">
            {[['500+', 'Creators'], ['1,000+', 'Clients'], ['5★', 'Avg Rating']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{num}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-950/80 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-3">How CreatorHub Works</h2>
            <p className="text-gray-400">From discovery to delivery in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary-500/0 via-primary-500/40 to-primary-500/0" />
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-900/60 to-accent-900/60 border border-primary-500/20 text-4xl mb-5 shadow-lg shadow-primary-900/20">
                  {icon}
                </div>
                <div className="absolute top-0 right-[calc(50%-2.5rem)] -translate-x-4 text-xs font-bold text-primary-500/50 font-mono">{step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((c) => (
              <Link
                key={c.value}
                to={`/explore?category=${c.value}`}
                className="card p-4 text-center group hover:scale-[1.04] hover:border-primary-500/40 transition-all"
              >
                <div className="text-3xl mb-2">{c.icon}</div>
                <p className="font-medium text-white text-xs group-hover:text-primary-400 transition-colors leading-tight">{c.label}</p>
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

      {/* Why CreatorHub — 4-benefit grid */}
      <section className="py-20 px-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="section-title mb-2">Why creators & clients choose us</h2>
              <p className="text-gray-400">Built for the creative economy — not a generic freelance platform.</p>
            </div>
            <Link to="/register" className="btn-primary whitespace-nowrap">Join Free →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
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
