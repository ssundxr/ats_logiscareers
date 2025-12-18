/**
 * Job detail page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Users,
  Loader2,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { jobsApi } from '../services/api';
import type { JobDescription, MatchResult } from '../types';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob(parseInt(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      setLoading(true);
      const data = await jobsApi.getById(jobId);
      setJob(data);
      setError(null);
    } catch (err) {
      setError('Failed to load job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !confirm('Are you sure you want to delete this job?')) return;

    try {
      await jobsApi.delete(job.id);
      navigate('/jobs');
    } catch (err) {
      alert('Failed to delete job');
      console.error(err);
    }
  };

  const handleMatchCandidates = async () => {
    if (!job) return;

    try {
      setMatching(true);
      const result = await jobsApi.matchCandidates(job.id);
      setMatchResults(result.results);
    } catch (err) {
      alert('Failed to match candidates');
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link
          to="/jobs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Jobs
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/jobs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Jobs
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete
        </button>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-lg text-gray-600 mt-1">{job.company_name}</p>
          <div className="flex flex-wrap gap-4 mt-4">
            {job.location && (
              <div className="flex items-center text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                {job.location}
              </div>
            )}
            <div className="flex items-center text-gray-500">
              <Briefcase className="w-4 h-4 mr-2" />
              {job.experience_years}+ years
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(job.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Skills Required */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Skills Required ({job.skills_required?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills_required && job.skills_required.length > 0 ? (
                job.skills_required.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No skills extracted</p>
              )}
            </div>
          </div>

          {/* Raw Text Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Extracted Text
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {job.raw_text || 'No text extracted'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Candidates */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Candidate Matching
          </h3>
          <button
            onClick={handleMatchCandidates}
            disabled={matching}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {matching ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Users className="w-5 h-5 mr-2" />
            )}
            {matching ? 'Matching...' : 'Match All Candidates'}
          </button>
        </div>

        {matchResults && (
          <div className="divide-y">
            {matchResults.length > 0 ? (
              matchResults.slice(0, 10).map((result) => (
                <div
                  key={result.candidate_id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        result.match_percentage >= 70
                          ? 'bg-green-500'
                          : result.match_percentage >= 40
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {Math.round(result.match_percentage)}%
                    </div>
                    <div>
                      <Link
                        to={`/candidates/${result.candidate_id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {result.candidate_name}
                      </Link>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.matched_skills.slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {skill}
                          </span>
                        ))}
                        {result.matched_skills.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{result.matched_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-gray-500 text-center">
                No candidates matched. Add some candidates first!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
