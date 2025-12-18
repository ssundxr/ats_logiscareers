/**
 * API service for communicating with the Django backend
 */

import axios from 'axios';
import type {
  JobDescription,
  JobDescriptionListItem,
  JobCreateData,
  Candidate,
  CandidateListItem,
  CandidateCreateData,
  Match,
  MatchListItem,
  DashboardStats,
  JobMatchResponse,
} from '../types';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract data from paginated response
const extractResults = <T>(data: any): T[] => {
  // If data is already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  // If data has results property (paginated), extract it
  if (data && data.results && Array.isArray(data.results)) {
    return data.results;
  }
  // Otherwise return empty array
  return [];
};

// Job Description API
export const jobsApi = {
  // Get all jobs
  getAll: async (): Promise<JobDescriptionListItem[]> => {
    const response = await api.get('/jobs/');
    return extractResults<JobDescriptionListItem>(response.data);
  },

  // Get a single job by ID
  getById: async (id: number): Promise<JobDescription> => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  // Create a new job with PDF upload
  create: async (data: JobCreateData): Promise<JobDescription> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('company_name', data.company_name);
    if (data.location) formData.append('location', data.location);
    formData.append('file', data.file);
    if (data.experience_years) {
      formData.append('experience_years', data.experience_years.toString());
    }

    const response = await api.post('/jobs/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete a job
  delete: async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}/`);
  },

  // Match all candidates to a job
  matchCandidates: async (jobId: number): Promise<JobMatchResponse> => {
    const response = await api.post(`/jobs/${jobId}/match_candidates/`);
    return response.data;
  },

  // Get top candidates for a job
  getTopCandidates: async (
    jobId: number,
    limit: number = 10,
    minMatch: number = 0
  ): Promise<any> => {
    const response = await api.get(
      `/jobs/${jobId}/top_candidates/?limit=${limit}&min_match=${minMatch}`
    );
    return response.data;
  },
};

// Candidate API
export const candidatesApi = {
  // Get all candidates
  getAll: async (): Promise<CandidateListItem[]> => {
    const response = await api.get('/candidates/');
    return extractResults<CandidateListItem>(response.data);
  },

  // Get a single candidate by ID
  getById: async (id: number): Promise<Candidate> => {
    const response = await api.get(`/candidates/${id}/`);
    return response.data;
  },

  // Create a new candidate with CV upload
  create: async (data: CandidateCreateData): Promise<Candidate> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    formData.append('file', data.file);
    if (data.experience_years) {
      formData.append('experience_years', data.experience_years.toString());
    }
    if (data.education_level) {
      formData.append('education_level', data.education_level);
    }

    const response = await api.post('/candidates/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete a candidate
  delete: async (id: number): Promise<void> => {
    await api.delete(`/candidates/${id}/`);
  },

  // Get matching jobs for a candidate
  getMatchingJobs: async (candidateId: number): Promise<any> => {
    const response = await api.get(`/candidates/${candidateId}/matching_jobs/`);
    return response.data;
  },

  // Match candidate to all jobs
  matchAllJobs: async (candidateId: number): Promise<any> => {
    const response = await api.post('/candidates/match_all_jobs/', {
      candidate_id: candidateId,
    });
    return response.data;
  },
};

// Match API
export const matchesApi = {
  // Get all matches
  getAll: async (): Promise<MatchListItem[]> => {
    const response = await api.get('/matches/');
    return extractResults<MatchListItem>(response.data);
  },

  // Get a single match by ID
  getById: async (id: number): Promise<Match> => {
    const response = await api.get(`/matches/${id}/`);
    return response.data;
  },

  // Get top matches
  getTop: async (limit: number = 20, minMatch: number = 50): Promise<Match[]> => {
    const response = await api.get(
      `/matches/top/?limit=${limit}&min_match=${minMatch}`
    );
    return extractResults<Match>(response.data);
  },

  // Get matches by job
  getByJob: async (jobId: number): Promise<Match[]> => {
    const response = await api.get(`/matches/by_job/?job_id=${jobId}`);
    return response.data;
  },

  // Get matches by candidate
  getByCandidate: async (candidateId: number): Promise<Match[]> => {
    const response = await api.get(
      `/matches/by_candidate/?candidate_id=${candidateId}`
    );
    return response.data;
  },

  // Bulk create all matches
  bulkCreate: async (): Promise<any> => {
    const response = await api.post('/matches/bulk_create/');
    return response.data;
  },

  // Delete a match
  delete: async (id: number): Promise<void> => {
    await api.delete(`/matches/${id}/`);
  },
};

// Dashboard API
export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};

// CV Score Checker API
export interface CVScoreCheckData {
  cv_file: File;
  job_title: string;
  required_skills: string;
  experience_years: number;
  job_description?: string;
}

export interface CVScoreHighlight {
  start: number;
  end: number;
  text: string;
  type: 'skill_match' | 'skill_found';
  skill: string;
}

export interface CVScoreResult {
  job_title: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  required_skills: string[];
  cv_skills: string[];
  cv_experience_years: number;
  cv_education: string | null;
  required_experience_years: number;
  experience_match: boolean;
  cv_text: string;
  highlights: CVScoreHighlight[];
  total_skills_found: number;
  total_skills_matched: number;
  total_skills_required: number;
}

export const cvCheckerApi = {
  // Check CV score against job requirements
  checkScore: async (data: CVScoreCheckData): Promise<CVScoreResult> => {
    const formData = new FormData();
    formData.append('cv_file', data.cv_file);
    formData.append('job_title', data.job_title);
    formData.append('required_skills', data.required_skills);
    formData.append('experience_years', data.experience_years.toString());
    if (data.job_description) {
      formData.append('job_description', data.job_description);
    }

    const response = await api.post('/cv-checker/check_score/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
