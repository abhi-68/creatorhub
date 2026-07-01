import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import VendorCard from '../components/VendorCard';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

const SORT_OPTIONS = [
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'reviews', label: '💬 Most Reviews' },
  { value: 'newest', label: '🆕 Newest' },
  { value: 'price_asc', label: '💰 Price: Low to High' },
  { value: 'price_desc', label: '💸 Price: High to Low' },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState('');

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'rating';
  const page = Number(searchParams.get('page') || 1);
  const available = searchParams.get('available') || '';
  const max_price = searchParams.get('max_price') || '';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => { setSearchInput(search); }, [search]);
  useEffect(() => { setBudgetInput(max_price); }, [max_price]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, sort });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (available) params.set('available', available);
    if (max_price) params.set('max_price', max_price);
    api.get(`/vendors?${params}`)
      .then((res) => { setVendors(res.data.vendors); setTotal(res.data.total); setPages(res.data.pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, page, available, max_price]);

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

  const applyBudget = (e) => {
    e.preventDefault();
    setParam('max_price', budgetInput);
  };

  const clearBudget = () => {
    setBudgetInput('');
    setParam('max_price', '');
  };

  const activeFilterCount = [available, max_price].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">Explore Creators</h1>
        <p className="text-gray-400">Discover talented photographers, influencers & creatives</p>
      </div>

      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input w-auto min-w-[180px]">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Available Now toggle */}
        <button
          onClick={() => setParam('available', available === '1' ? '' : '1')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${available === '1' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'}`}
        >
          <span className={`w-2 h-2 rounded-full ${available === '1' ? 'bg-green-400' : 'bg-gray-600'}`} />
          Available Now
        </button>

        {/* Budget filter */}
        <form onSubmit={applyBudget} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              min="0"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Max budget"
              className="input pl-6 py-2 w-36 text-sm"
            />
          </div>
          <button type="submit" className="btn-secondary text-sm py-2 px-3">Apply</button>
          {max_price && (
            <button type="button" onClick={clearBudget} className="text-gray-500 hover:text-white transition-colors">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Active filter indicator */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setParam('available', ''); clearBudget(); }}
            className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
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
        <p className="text-gray-500 text-sm mb-6">
          {total} creator{total !== 1 ? 's' : ''} found
          {max_price && <span className="text-primary-400 ml-1">under ${max_price}</span>}
          {available === '1' && <span className="text-green-400 ml-1">· available now</span>}
        </p>
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
