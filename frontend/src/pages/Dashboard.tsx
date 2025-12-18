/**
 * Dashboard page component
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  GitCompare,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button
          onClick={loadStats}
          className="ml-4 text-red-600 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={loadStats}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats?.total_jobs || 0}
          icon={Briefcase}
          color="blue"
          link="/jobs"
        />
        <StatCard
          title="Total Candidates"
          value={stats?.total_candidates || 0}
          icon={Users}
          color="green"
          link="/candidates"
        />
        <StatCard
          title="Total Matches"
          value={stats?.total_matches || 0}
          icon={GitCompare}
          color="purple"
          link="/matches"
        />
        <StatCard
          title="High Quality Matches"
          value={stats?.high_quality_matches || 0}
          icon={TrendingUp}
          color="orange"
          subtitle="≥70% match"
        />
      </div>

      {/* Average Match */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Match Score
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats?.average_match_percentage || 0}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {stats?.average_match_percentage?.toFixed(1) || 0}%
          </span>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <Link
              to="/jobs"
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y">
            {stats?.recent_jobs && stats.recent_jobs.length > 0 ? (
              stats.recent_jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">
                    {job.company_name} • {job.skills_count} skills required
                  </p>
                </Link>
              ))
            ) : (
              <p className="p-4 text-gray-500 text-center">No jobs yet</p>
            )}
          </div>
        </div>

        {/* Recent Candidates */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Candidates
            </h3>
            <Link
              to="/candidates"
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y">
            {stats?.recent_candidates && stats.recent_candidates.length > 0 ? (
              stats.recent_candidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  to={`/candidates/${candidate.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{candidate.name}</p>
                  <p className="text-sm text-gray-500">
                    {candidate.email} • {candidate.skills_count} skills
                  </p>
                </Link>
              ))
            ) : (
              <p className="p-4 text-gray-500 text-center">No candidates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  link?: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, link, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const content = (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
