/**
 * Candidates listing and management page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Briefcase,
  Loader2,
  Upload,
  X,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { candidatesApi } from '../services/api';
import type { CandidateListItem, CandidateCreateData } from '../types';

export default function Candidates() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await candidatesApi.getAll();
      setCandidates(data);
      setError(null);
    } catch (err) {
      setError('Failed to load candidates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      await candidatesApi.delete(id);
      setCandidates(candidates.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete candidate');
      console.error(err);
    }
  };

  const handleMatchJobs = async (candidateId: number) => {
    try {
      const result = await candidatesApi.matchAllJobs(candidateId);
      alert(
        `Matched ${result.total_jobs} jobs!\n` +
          `Created: ${result.matches_created}, Updated: ${result.matches_updated}`
      );
    } catch (err) {
      alert('Failed to match jobs');
      console.error(err);
    }
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEducationLabel = (level?: string) => {
    const labels: Record<string, string> = {
      high_school: 'High School',
      associate: 'Associate',
      bachelor: "Bachelor's",
      master: "Master's",
      phd: 'PhD',
      other: 'Other',
    };
    return level ? labels[level] || level : 'Not specified';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Candidate
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search candidates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={loadCandidates}
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
        /* Candidates Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onDelete={handleDelete}
                onMatch={handleMatchJobs}
                getEducationLabel={getEducationLabel}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchTerm
                ? 'No candidates match your search'
                : 'No candidates yet. Add your first candidate!'}
            </div>
          )}
        </div>
      )}

      {/* Add Candidate Modal */}
      {showModal && (
        <AddCandidateModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadCandidates();
          }}
        />
      )}
    </div>
  );
}

interface CandidateCardProps {
  candidate: CandidateListItem;
  onDelete: (id: number) => void;
  onMatch: (id: number) => void;
  getEducationLabel: (level?: string) => string;
}

function CandidateCard({
  candidate,
  onDelete,
  onMatch,
  getEducationLabel,
}: CandidateCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{candidate.name}</h3>
          <p className="text-gray-600 mt-1 flex items-center text-sm">
            <Mail className="w-4 h-4 mr-1" />
            {candidate.email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/candidates/${candidate.id}`}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button
            onClick={() => onDelete(candidate.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {candidate.phone && (
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="w-4 h-4 mr-2" />
            {candidate.phone}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <Briefcase className="w-4 h-4 mr-2" />
          {candidate.experience_years} years experience
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <GraduationCap className="w-4 h-4 mr-2" />
          {getEducationLabel(candidate.education_level)}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(candidate.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {candidate.skills_count} skills
        </span>
        <button
          onClick={() => onMatch(candidate.id)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <Briefcase className="w-4 h-4 mr-1" />
          Match Jobs
        </button>
      </div>
    </div>
  );
}

interface AddCandidateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddCandidateModal({ onClose, onSuccess }: AddCandidateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience_years: 0,
    education_level: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please upload a CV/Resume PDF');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await candidatesApi.create({
        ...formData,
        file,
      } as CandidateCreateData);

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.message || 'Failed to create candidate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Candidate</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., +1 234 567 8900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (years)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience_years: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education
              </label>
              <select
                value={formData.education_level}
                onChange={(e) =>
                  setFormData({ ...formData, education_level: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="high_school">High School</option>
                <option value="associate">Associate</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CV/Resume PDF *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 10MB</p>
                {file && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
