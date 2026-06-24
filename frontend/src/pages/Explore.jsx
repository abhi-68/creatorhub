import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import VendorCard from '../components/VendorCard';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'photographer', label: '📷 Photographers' },
  { value: 'influencer', label: '📱 Influencers' },
  { value: 'videographer', label: '🎬 Videographers' },
  { value: 'graphic_designer', label: '🎨 Designers' },
  { value: 'content_creator', label: '✍️ Content Creators' },
  { value: 'model', label: '✨ Models' },
  { value: 'makeup_artist', label: '💄 Makeup Artists' },
  { value: 'other', label: '🌟 Other' },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'rating';
  const page = Number(searchParams.get('page') || 1);
  const [searchInput, setSearchInput] = useState(search);

  // Keep input in sync when the URL changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, sort });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    api.get(`/vendors?${params}`)
      .then((res) => { setVendors(res.data.vendors); setTotal(res.data.total); setPages(res.data.pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setParam('search', searchInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">Explore Creators</h1>
        <p className="text-gray-400">Discover talented photographers, influencers & creatives</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, location, bio..."
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input w-auto min-w-[150px]">
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
          <option value="reviews">Most Reviews</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setParam('category', c.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${category === c.value ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-gray-500 text-sm mb-6">{total} creator{total !== 1 ? 's' : ''} found</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-gray-800" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No creators found</h3>
          <p className="text-gray-400">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vendors.map((v) => <VendorCard key={v._id} vendor={v} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setParam('page', p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
