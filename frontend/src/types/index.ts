/**
 * TypeScript type definitions for the ATS application
 */

// Job Description types
export interface JobDescription {
  id: number;
  title: string;
  company_name: string;
  location?: string;
  file: string;
  raw_text: string;
  skills_required: string[];
  experience_years: number;
  created_at: string;
}

export interface JobDescriptionListItem {
  id: number;
  title: string;
  company_name: string;
  location?: string;
  experience_years: number;
  skills_count: number;
  created_at: string;
}

export interface JobCreateData {
  title: string;
  company_name: string;
  location?: string;
  file: File;
  experience_years?: number;
}

// Candidate types
export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  file: string;
  raw_text: string;
  skills_extracted: string[];
  experience_years: number;
  education_level?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateListItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  experience_years: number;
  education_level?: string;
  skills_count: number;
  created_at: string;
}

export interface CandidateCreateData {
  name: string;
  email: string;
  phone?: string;
  file: File;
  experience_years?: number;
  education_level?: string;
}

// Match types
export interface Match {
  id: number;
  job: number;
  job_title: string;
  company_name: string;
  candidate: number;
  candidate_name: string;
  candidate_email: string;
  match_percentage: number;
  keyword_matches: Record<string, boolean>;
  semantic_score: number;
  matched_on: string;
}

export interface MatchListItem {
  id: number;
  job_title: string;
  candidate_name: string;
  match_percentage: number;
  semantic_score: number;
  matched_on: string;
}

export interface MatchResult {
  candidate_id: number;
  candidate_name: string;
  match_percentage: number;
  matched_skills: string[];
}

export interface JobMatchResponse {
  job_id: number;
  job_title: string;
  total_candidates: number;
  matches_created: number;
  matches_updated: number;
  results: MatchResult[];
}

// Dashboard types
export interface DashboardStats {
  total_jobs: number;
  total_candidates: number;
  total_matches: number;
  high_quality_matches: number;
  average_match_percentage: number;
  recent_jobs: JobDescriptionListItem[];
  recent_candidates: CandidateListItem[];
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
