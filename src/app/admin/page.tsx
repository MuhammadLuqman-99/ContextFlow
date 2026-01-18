'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRepositories: number;
  monthlyRevenue: number;
  newUsersToday: number;
  newUsersWeek: number;
}

interface User {
  id: string;
  github_username: string;
  avatar_url: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    // Strict admin check - redirect non-admins
    if (!userData?.is_admin) {
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
    await Promise.all([loadStats(), loadUsers(1)]);
    setLoading(false);
  }

  async function loadStats() {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'trialing']);

    // Get total repositories
    const { count: totalRepositories } = await supabase
      .from('repositories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    setStats({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalRepositories: totalRepositories || 0,
      monthlyRevenue: (activeSubscriptions || 0) * 12, // Estimate
      newUsersToday: newUsersToday || 0,
      newUsersWeek: newUsersWeek || 0,
    });
  }

  async function loadUsers(page: number) {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('users')
      .select('id, github_username, avatar_url, email, subscription_plan, subscription_status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (searchQuery) {
      query = query.or(`github_username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setUsers(data);
      setTotalPages(Math.ceil((count || 0) / perPage));
      setCurrentPage(page);
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: `+${stats?.newUsersWeek || 0} this week`,
      positive: true,
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'from-green-500 to-green-600',
      change: `${Math.round(((stats?.activeSubscriptions || 0) / (stats?.totalUsers || 1)) * 100)}% conversion`,
      positive: true,
    },
    {
      title: 'Repositories',
      value: stats?.totalRepositories || 0,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      change: 'Active repos',
      positive: true,
    },
    {
      title: 'Est. MRR',
      value: `$${stats?.monthlyRevenue || 0}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      change: 'Monthly recurring',
      positive: true,
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">System overview and user management</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to App
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.positive ? (
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <span className={stat.positive ? 'text-green-400' : 'text-red-400'}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    loadUsers(1);
                  }}
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-neon-purple/50"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || '/default-avatar.png'}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium">{user.github_username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription_plan === 'team'
                          ? 'bg-blue-500/20 text-blue-400'
                          : user.subscription_plan === 'pro'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.subscription_plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription_status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : user.subscription_status === 'trialing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.subscription_status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t border-white/10">
            <p className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadUsers(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadUsers(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
