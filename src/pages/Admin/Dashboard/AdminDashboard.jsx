import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import DashboardCard from '../components/DashboardCard';
import { LineChart, BarChart, TrendingTagsChart } from '../components/Charts';
import adminService from '../services/adminService';
import LoadingSkeleton from '../components/LoadingSkeleton';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard Loading...</h1>
          </div>
        </div>
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" rows={6} cols={3} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ color: 'var(--admin-danger)', padding: '24px', textAlign: 'center' }}>
          <h2>Error loading dashboard: {error}</h2>
        </div>
      </AdminLayout>
    );
  }

  const { cards, charts } = stats;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Overview</h1>
          <p className="admin-page-desc">Real-time counts, trends, and moderation metrics</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="admin-cards-grid">
        <DashboardCard 
          title="Total Users" 
          value={cards.totalUsers} 
          color="#8b5cf6"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <DashboardCard 
          title="Active Users" 
          value={cards.activeUsers} 
          color="#3b82f6"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <DashboardCard 
          title="New Users Today" 
          value={cards.newUsersToday} 
          color="#10b981"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
        />
        <DashboardCard 
          title="Total Posts" 
          value={cards.totalPosts} 
          color="#6366f1"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
        />
        <DashboardCard 
          title="Total Comments" 
          value={cards.totalComments} 
          color="#ec4899"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
        <DashboardCard 
          title="Total Likes" 
          value={cards.totalLikes} 
          color="#f43f5e"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        />
        <DashboardCard 
          title="Total Stories" 
          value={cards.totalStories} 
          color="#eab308"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
        />
        <DashboardCard 
          title="Total Saved" 
          value={cards.totalSavedPosts} 
          color="#14b8a6"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
        />
        <DashboardCard 
          title="Active Reports" 
          value={cards.totalReports} 
          color="#f97316"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <DashboardCard 
          title="Deleted Posts" 
          value={cards.deletedPosts} 
          color="#64748b"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
        />
        <DashboardCard 
          title="Deleted Comments" 
          value={cards.deletedComments} 
          color="#94a3b8"
          icon={<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
        />
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        <div className="admin-chart-box">
          <div className="admin-chart-title">Monthly User Growth</div>
          <LineChart data={charts.monthlyUserGrowth} xKey="month" yKey="count" height={220} />
        </div>

        <div className="admin-chart-box">
          <div className="admin-chart-title">Monthly Posts Created</div>
          <BarChart data={charts.monthlyPosts} xKey="month" yKey="count" height={220} />
        </div>

        <div className="admin-chart-box">
          <div className="admin-chart-title">Daily Active Users (Last 7 Days)</div>
          <LineChart data={charts.dailyActiveUsers} xKey="day" yKey="count" height={220} />
        </div>

        <div className="admin-chart-box">
          <div className="admin-chart-title">Weekly Engagement (Likes + Comments)</div>
          <BarChart data={charts.weeklyEngagement} xKey="day" yKey="engagement" height={220} />
        </div>

        <div className="admin-chart-box" style={{ gridColumn: 'span 1' }}>
          <div className="admin-chart-title" style={{ marginBottom: '12px' }}>Trending Hashtags</div>
          <TrendingTagsChart data={charts.trendingHashtags} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
