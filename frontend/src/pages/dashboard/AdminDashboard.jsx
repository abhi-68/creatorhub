import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CheckBadgeIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (tab !== 'users') return;
    setLoading(true);
    const params = new URLSearchParams({ limit: 50 });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    api.get(`/admin/users?${params}`)
      .then((res) => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, search, roleFilter]);

  const toggleActive = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Permanently delete "${userName}" and all their data?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const verifyUserEmail = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify-email`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isVerified: true } : u));
      toast.success('Email verified!');
    } catch { toast.error('Failed'); }
  };

  const featureVendor = async (vendorId, featured) => {
    try {
      await api.put(`/admin/vendors/${vendorId}/feature`, { featured: !featured });
      setUsers((prev) => prev.map((u) => u._id === vendorId ? { ...u, vendorProfile: { ...u.vendorProfile, featured: !featured } } : u));
      toast.success(!featured ? 'Vendor featured!' : 'Feature removed');
    } catch { toast.error('Failed'); }
  };

  const verifyId = async (vendorId) => {
    try {
      await api.put(`/admin/vendors/${vendorId}/verify-id`);
      setUsers((prev) => prev.map((u) => u._id === vendorId ? { ...u, vendorProfile: { ...u.vendorProfile, idVerified: true } } : u));
      toast.success('ID verified!');
    } catch { toast.error('Failed'); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: 'from-blue-600 to-blue-500' },
    { label: 'Total Vendors', value: stats.totalVendors, icon: '🌟', color: 'from-primary-600 to-primary-500' },
    { label: 'Verified Vendors', value: stats.verifiedVendors, icon: '✅', color: 'from-green-600 to-green-500' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: '⭐', color: 'from-yellow-600 to-yellow-500' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage the CreatorHub platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-8 w-fit">
        {['stats', 'users'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'stats' ? '📊 Stats' : '👥 Users'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-white/80 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input flex-1" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto">
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="vendor">Vendors</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u._id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-xs font-bold">
                              {u.name?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{u.name}</p>
                            <p className="text-gray-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${u.role === 'vendor' ? 'bg-primary-500/20 text-primary-400' : u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {u.isVerified ? '✓ Email' : 'Unverified'}
                        </span>
                        {u.role === 'vendor' && u.vendorProfile?.idDocument && !u.vendorProfile?.idVerified && (
                          <span className="badge bg-orange-500/20 text-orange-400 ml-1">ID Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!u.isVerified && (
                            <button onClick={() => verifyUserEmail(u._id)}
                              className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                              ✉️ Verify Email
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button onClick={() => toggleActive(u._id, u.isActive)}
                              className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {u.role === 'vendor' && (
                            <>
                              <button onClick={() => featureVendor(u._id, u.vendorProfile?.featured)}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.vendorProfile?.featured ? 'bg-yellow-500/30 text-yellow-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                                {u.vendorProfile?.featured ? '⭐ Unfeature' : 'Feature'}
                              </button>
                              {u.vendorProfile?.idDocument && !u.vendorProfile?.idVerified && (
                                <button onClick={() => verifyId(u._id)} className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                  Verify ID
                                </button>
                              )}
                            </>
                          )}
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u._id, u.name)}
                              className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
