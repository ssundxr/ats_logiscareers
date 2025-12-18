/**
 * Matches listing page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { matchesApi } from '../services/api';
import type { Match } from '../types';

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [minMatch, setMinMatch] = useState(0);

  useEffect(() => {
    loadMatches();
  }, [minMatch]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchesApi.getTop(100, minMatch);
      setMatches(data);
      setError(null);
    } catch (err) {
      setError('Failed to load matches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMatch = async () => {
    if (
      !confirm(
        'This will match all candidates against all jobs. This may take a while. Continue?'
      )
    )
      return;

    try {
      setBulkLoading(true);
      const result = await matchesApi.bulkCreate();
      alert(
        `Bulk matching completed!\n` +
          `Jobs: ${result.total_jobs}\n` +
          `Candidates: ${result.total_candidates}\n` +
          `Matches created/updated: ${result.total_matches}`
      );
      loadMatches();
    } catch (err) {
      alert('Failed to create bulk matches');
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-50 border-green-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 30) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadMatches}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleBulkMatch}
            disabled={bulkLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {bulkLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2" />
            )}
            {bulkLoading ? 'Matching...' : 'Run Bulk Match'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Minimum Match:</span>
          <div className="flex items-center space-x-2">
            {[0, 30, 50, 70].map((value) => (
              <button
                key={value}
                onClick={() => setMinMatch(value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  minMatch === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {value}%+
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={loadMatches}
            className="ml-4 text-red-600 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        /* Matches List */
        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <div
                key={match.id}
                className={`rounded-xl border p-6 transition-shadow hover:shadow-md ${getMatchBgColor(
                  match.match_percentage
                )}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Match Score */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getMatchColor(
                        match.match_percentage
                      )}`}
                    >
                      {Math.round(match.match_percentage)}%
                    </div>

                    {/* Match Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-lg">
                        <Link
                          to={`/candidates/${match.candidate}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {match.candidate_name}
                        </Link>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <Link
                          to={`/jobs/${match.job}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {match.job_title}
                        </Link>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {match.company_name} • {match.candidate_email}
                      </p>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="flex flex-wrap gap-2">
                    {match.keyword_matches &&
                      Object.entries(match.keyword_matches)
                        .filter(([_, matched]) => matched)
                        .slice(0, 5)
                        .map(([skill, _], i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-white border border-green-300 text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {skill}
                          </span>
                        ))}
                    {match.keyword_matches &&
                      Object.values(match.keyword_matches).filter(Boolean).length >
                        5 && (
                        <span className="text-xs text-gray-500 self-center">
                          +
                          {Object.values(match.keyword_matches).filter(Boolean)
                            .length - 5}{' '}
                          more
                        </span>
                      )}
                  </div>
                </div>

                {/* Match metadata */}
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Matched on {new Date(match.matched_on).toLocaleDateString()}
                  </span>
                  {match.semantic_score > 0 && (
                    <span>Semantic score: {match.semantic_score.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              <p className="text-lg">No matches found</p>
              <p className="text-sm mt-2">
                Upload jobs and candidates, then run bulk matching to see results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
