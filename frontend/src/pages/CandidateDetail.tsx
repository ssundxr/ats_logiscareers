/**
 * Candidate detail page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Briefcase,
  Loader2,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { candidatesApi } from '../services/api';
import type { Candidate } from '../types';

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<any[] | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (id) {
      loadCandidate(parseInt(id));
    }
  }, [id]);

  const loadCandidate = async (candidateId: number) => {
    try {
      setLoading(true);
      const data = await candidatesApi.getById(candidateId);
      setCandidate(data);
      setError(null);
    } catch (err) {
      setError('Failed to load candidate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!candidate || !confirm('Are you sure you want to delete this candidate?'))
      return;

    try {
      await candidatesApi.delete(candidate.id);
      navigate('/candidates');
    } catch (err) {
      alert('Failed to delete candidate');
      console.error(err);
    }
  };

  const handleMatchJobs = async () => {
    if (!candidate) return;

    try {
      setMatching(true);
      const result = await candidatesApi.matchAllJobs(candidate.id);
      setMatchResults(result.results);
    } catch (err) {
      alert('Failed to match jobs');
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  const getEducationLabel = (level?: string) => {
    const labels: Record<string, string> = {
      high_school: 'High School',
      associate: 'Associate Degree',
      bachelor: "Bachelor's Degree",
      master: "Master's Degree",
      phd: 'PhD',
      other: 'Other',
    };
    return level ? labels[level] || level : 'Not specified';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <Link
          to="/candidates"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Candidates
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Candidate not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidates"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Candidates
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete
        </button>
      </div>

      {/* Candidate Details */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center text-gray-500">
              <Mail className="w-4 h-4 mr-2" />
              {candidate.email}
            </div>
            {candidate.phone && (
              <div className="flex items-center text-gray-500">
                <Phone className="w-4 h-4 mr-2" />
                {candidate.phone}
              </div>
            )}
            <div className="flex items-center text-gray-500">
              <Briefcase className="w-4 h-4 mr-2" />
              {candidate.experience_years} years experience
            </div>
            <div className="flex items-center text-gray-500">
              <GraduationCap className="w-4 h-4 mr-2" />
              {getEducationLabel(candidate.education_level)}
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              Added {new Date(candidate.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Skills Extracted */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Skills Extracted ({candidate.skills_extracted?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills_extracted && candidate.skills_extracted.length > 0 ? (
                candidate.skills_extracted.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
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
              Extracted Text from CV
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {candidate.raw_text || 'No text extracted'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Jobs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Job Matching</h3>
          <button
            onClick={handleMatchJobs}
            disabled={matching}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {matching ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Briefcase className="w-5 h-5 mr-2" />
            )}
            {matching ? 'Matching...' : 'Match All Jobs'}
          </button>
        </div>

        {matchResults && (
          <div className="divide-y">
            {matchResults.length > 0 ? (
              matchResults.slice(0, 10).map((result) => (
                <div
                  key={result.job_id}
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
                        to={`/jobs/${result.job_id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {result.job_title}
                      </Link>
                      <p className="text-sm text-gray-500">{result.company_name}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-gray-500 text-center">
                No jobs matched. Add some jobs first!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
