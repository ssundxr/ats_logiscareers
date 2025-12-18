"""
API Views for the ATS system.
Provides CRUD operations for JobDescriptions, Candidates, and Matches.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q

from .models import JobDescription, Candidate, Match
from .serializers import (
    JobDescriptionSerializer,
    JobDescriptionListSerializer,
    CandidateSerializer,
    CandidateListSerializer,
    MatchSerializer,
    MatchListSerializer,
    MatchCreateSerializer,
    BulkMatchSerializer,
)
from .utils import calculate_skill_match


class JobDescriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for JobDescription CRUD operations.
    
    Endpoints:
    - GET /api/jobs/ - List all jobs
    - POST /api/jobs/ - Create a new job (with PDF upload)
    - GET /api/jobs/{id}/ - Retrieve a job
    - PUT /api/jobs/{id}/ - Update a job
    - DELETE /api/jobs/{id}/ - Delete a job
    - POST /api/jobs/{id}/match_candidates/ - Match all candidates to this job
    """
    queryset = JobDescription.objects.all()
    permission_classes = [AllowAny]  # Change to [IsAuthenticated] in production
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'company_name', 'location', 'raw_text']
    ordering_fields = ['created_at', 'experience_years', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobDescriptionListSerializer
        return JobDescriptionSerializer
    
    @action(detail=True, methods=['post'])
    def match_candidates(self, request, pk=None):
        """
        Match all candidates against this job description.
        Creates or updates Match records for each candidate.
        """
        job = self.get_object()
        candidates = Candidate.objects.all()
        
        matches_created = 0
        matches_updated = 0
        results = []
        
        for candidate in candidates:
            # Calculate match
            match_percentage, keyword_matches = calculate_skill_match(
                job.skills_required,
                candidate.skills_extracted
            )
            
            # Create or update match record
            match, created = Match.objects.update_or_create(
                job=job,
                candidate=candidate,
                defaults={
                    'match_percentage': match_percentage,
                    'keyword_matches': keyword_matches,
                    'semantic_score': 0.0,  # Will be updated with NLP later
                }
            )
            
            if created:
                matches_created += 1
            else:
                matches_updated += 1
            
            results.append({
                'candidate_id': candidate.id,
                'candidate_name': candidate.name,
                'match_percentage': match_percentage,
                'matched_skills': [k for k, v in keyword_matches.items() if v],
            })
        
        # Sort by match percentage descending
        results.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'total_candidates': len(candidates),
            'matches_created': matches_created,
            'matches_updated': matches_updated,
            'results': results,
        })
    
    @action(detail=True, methods=['get'])
    def top_candidates(self, request, pk=None):
        """
        Get top matching candidates for this job.
        """
        job = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        min_match = float(request.query_params.get('min_match', 0))
        
        matches = Match.objects.filter(
            job=job,
            match_percentage__gte=min_match
        ).select_related('candidate').order_by('-match_percentage')[:limit]
        
        results = []
        for match in matches:
            results.append({
                'candidate_id': match.candidate.id,
                'candidate_name': match.candidate.name,
                'candidate_email': match.candidate.email,
                'match_percentage': match.match_percentage,
                'semantic_score': match.semantic_score,
                'matched_skills': [k for k, v in match.keyword_matches.items() if v],
                'experience_years': match.candidate.experience_years,
                'education_level': match.candidate.education_level,
            })
        
        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'top_candidates': results,
        })


class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Candidate CRUD operations.
    
    Endpoints:
    - GET /api/candidates/ - List all candidates
    - POST /api/candidates/ - Create a new candidate (with CV upload)
    - GET /api/candidates/{id}/ - Retrieve a candidate
    - PUT /api/candidates/{id}/ - Update a candidate
    - DELETE /api/candidates/{id}/ - Delete a candidate
    - GET /api/candidates/{id}/matching_jobs/ - Get matching jobs for candidate
    """
    queryset = Candidate.objects.all()
    permission_classes = [AllowAny]  # Change to [IsAuthenticated] in production
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'raw_text', 'skills_extracted']
    ordering_fields = ['created_at', 'experience_years', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CandidateListSerializer
        return CandidateSerializer
    
    @action(detail=True, methods=['get'])
    def matching_jobs(self, request, pk=None):
        """
        Get jobs that match this candidate's skills.
        """
        candidate = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        min_match = float(request.query_params.get('min_match', 0))
        
        # Get existing matches
        matches = Match.objects.filter(
            candidate=candidate,
            match_percentage__gte=min_match
        ).select_related('job').order_by('-match_percentage')[:limit]
        
        results = []
        for match in matches:
            results.append({
                'job_id': match.job.id,
                'job_title': match.job.title,
                'company_name': match.job.company_name,
                'location': match.job.location,
                'match_percentage': match.match_percentage,
                'semantic_score': match.semantic_score,
                'matched_skills': [k for k, v in match.keyword_matches.items() if v],
                'required_experience': match.job.experience_years,
            })
        
        return Response({
            'candidate_id': candidate.id,
            'candidate_name': candidate.name,
            'matching_jobs': results,
        })
    
    @action(detail=False, methods=['post'])
    def match_all_jobs(self, request):
        """
        Match a specific candidate against all jobs.
        """
        candidate_id = request.data.get('candidate_id')
        
        try:
            candidate = Candidate.objects.get(pk=candidate_id)
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        jobs = JobDescription.objects.all()
        
        matches_created = 0
        matches_updated = 0
        results = []
        
        for job in jobs:
            match_percentage, keyword_matches = calculate_skill_match(
                job.skills_required,
                candidate.skills_extracted
            )
            
            match, created = Match.objects.update_or_create(
                job=job,
                candidate=candidate,
                defaults={
                    'match_percentage': match_percentage,
                    'keyword_matches': keyword_matches,
                    'semantic_score': 0.0,
                }
            )
            
            if created:
                matches_created += 1
            else:
                matches_updated += 1
            
            results.append({
                'job_id': job.id,
                'job_title': job.title,
                'company_name': job.company_name,
                'match_percentage': match_percentage,
            })
        
        results.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return Response({
            'candidate_id': candidate.id,
            'candidate_name': candidate.name,
            'total_jobs': len(jobs),
            'matches_created': matches_created,
            'matches_updated': matches_updated,
            'results': results,
        })


class MatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Match CRUD operations.
    
    Endpoints:
    - GET /api/matches/ - List all matches
    - POST /api/matches/ - Create a new match
    - GET /api/matches/{id}/ - Retrieve a match
    - DELETE /api/matches/{id}/ - Delete a match
    - GET /api/matches/top/ - Get top matches across all jobs
    """
    queryset = Match.objects.all().select_related('job', 'candidate')
    permission_classes = [AllowAny]  # Change to [IsAuthenticated] in production
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['match_percentage', 'semantic_score', 'matched_on']
    ordering = ['-match_percentage']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        if self.action == 'create':
            return MatchCreateSerializer
        return MatchSerializer
    
    @action(detail=False, methods=['get'])
    def top(self, request):
        """
        Get top matches across all jobs.
        """
        limit = int(request.query_params.get('limit', 20))
        min_match = float(request.query_params.get('min_match', 50))
        
        matches = Match.objects.filter(
            match_percentage__gte=min_match
        ).select_related('job', 'candidate').order_by('-match_percentage')[:limit]
        
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_job(self, request):
        """
        Get matches for a specific job.
        """
        job_id = request.query_params.get('job_id')
        
        if not job_id:
            return Response(
                {'error': 'job_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        matches = Match.objects.filter(
            job_id=job_id
        ).select_related('candidate').order_by('-match_percentage')
        
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_candidate(self, request):
        """
        Get matches for a specific candidate.
        """
        candidate_id = request.query_params.get('candidate_id')
        
        if not candidate_id:
            return Response(
                {'error': 'candidate_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        matches = Match.objects.filter(
            candidate_id=candidate_id
        ).select_related('job').order_by('-match_percentage')
        
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create matches for all job-candidate combinations.
        """
        jobs = JobDescription.objects.all()
        candidates = Candidate.objects.all()
        
        total_matches = 0
        
        for job in jobs:
            for candidate in candidates:
                match_percentage, keyword_matches = calculate_skill_match(
                    job.skills_required,
                    candidate.skills_extracted
                )
                
                Match.objects.update_or_create(
                    job=job,
                    candidate=candidate,
                    defaults={
                        'match_percentage': match_percentage,
                        'keyword_matches': keyword_matches,
                        'semantic_score': 0.0,
                    }
                )
                total_matches += 1
        
        return Response({
            'message': 'Bulk matching completed',
            'total_jobs': len(jobs),
            'total_candidates': len(candidates),
            'total_matches': total_matches,
        })


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard statistics.
    """
    permission_classes = [AllowAny]  # Change to [IsAuthenticated] in production
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get dashboard statistics.
        """
        total_jobs = JobDescription.objects.count()
        total_candidates = Candidate.objects.count()
        total_matches = Match.objects.count()
        
        # Top matches
        top_matches = Match.objects.filter(
            match_percentage__gte=70
        ).count()
        
        # Average match percentage
        from django.db.models import Avg
        avg_match = Match.objects.aggregate(avg=Avg('match_percentage'))['avg'] or 0
        
        # Recent jobs
        recent_jobs = JobDescription.objects.order_by('-created_at')[:5]
        recent_jobs_data = JobDescriptionListSerializer(recent_jobs, many=True).data
        
        # Recent candidates
        recent_candidates = Candidate.objects.order_by('-created_at')[:5]
        recent_candidates_data = CandidateListSerializer(recent_candidates, many=True).data
        
        return Response({
            'total_jobs': total_jobs,
            'total_candidates': total_candidates,
            'total_matches': total_matches,
            'high_quality_matches': top_matches,
            'average_match_percentage': round(avg_match, 2),
            'recent_jobs': recent_jobs_data,
            'recent_candidates': recent_candidates_data,
        })


class CVScoreCheckerViewSet(viewsets.ViewSet):
    """
    ViewSet for quick CV score checking without saving to database.
    Upload a CV and provide job requirements to get instant matching score.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    @action(detail=False, methods=['post'])
    def check_score(self, request):
        """
        Check CV score against job requirements.
        
        Request:
        - cv_file: PDF file of the CV
        - job_title: Title of the job
        - required_skills: Comma-separated list of required skills
        - experience_years: Required years of experience
        - job_description: Optional job description text
        
        Returns:
        - match_percentage: Overall match score
        - matched_skills: List of skills that matched
        - missing_skills: List of skills not found in CV
        - cv_skills: All skills extracted from CV
        - cv_text: Extracted text from CV with match positions
        - experience_match: Whether experience requirement is met
        - highlights: Positions of matched keywords for highlighting
        """
        from .utils import (
            extract_text_from_pdf,
            extract_skills,
            extract_experience_years,
            extract_education_level,
            calculate_skill_match,
        )
        import re
        
        # Get the uploaded CV file
        cv_file = request.FILES.get('cv_file')
        if not cv_file:
            return Response(
                {'error': 'CV file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get job requirements
        job_title = request.data.get('job_title', 'Unknown Position')
        required_skills_str = request.data.get('required_skills', '')
        required_experience = int(request.data.get('experience_years', 0))
        job_description = request.data.get('job_description', '')
        
        # Parse required skills from comma-separated string
        if required_skills_str:
            required_skills = [s.strip() for s in required_skills_str.split(',') if s.strip()]
        else:
            required_skills = []
        
        # If job description provided, extract skills from it too
        if job_description:
            jd_skills = extract_skills(job_description)
            # Combine with manually provided skills
            all_required_skills = list(set(required_skills + jd_skills))
        else:
            all_required_skills = required_skills
        
        # Extract text from CV
        cv_text = extract_text_from_pdf(cv_file)
        
        if not cv_text:
            return Response(
                {'error': 'Could not extract text from CV. Please ensure it is a valid PDF.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract information from CV
        cv_skills = extract_skills(cv_text)
        cv_experience = extract_experience_years(cv_text)
        cv_education = extract_education_level(cv_text)
        
        # Calculate skill match
        if all_required_skills:
            match_percentage, skill_matches = calculate_skill_match(
                all_required_skills,
                cv_skills
            )
            matched_skills = [skill for skill, matched in skill_matches.items() if matched]
            missing_skills = [skill for skill, matched in skill_matches.items() if not matched]
        else:
            match_percentage = 0
            matched_skills = []
            missing_skills = []
            skill_matches = {}
        
        # Check experience match
        experience_match = cv_experience >= required_experience if required_experience > 0 else True
        
        # Find highlight positions for matched keywords in CV text
        highlights = []
        cv_text_lower = cv_text.lower()
        
        # Highlight matched skills
        for skill in matched_skills:
            skill_lower = skill.lower()
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            for match in re.finditer(pattern, cv_text_lower):
                highlights.append({
                    'start': match.start(),
                    'end': match.end(),
                    'text': cv_text[match.start():match.end()],
                    'type': 'skill_match',
                    'skill': skill,
                })
        
        # Highlight all CV skills (even those not in job requirements)
        for skill in cv_skills:
            if skill.lower() not in [m.lower() for m in matched_skills]:
                skill_lower = skill.lower()
                pattern = r'\b' + re.escape(skill_lower) + r'\b'
                for match in re.finditer(pattern, cv_text_lower):
                    highlights.append({
                        'start': match.start(),
                        'end': match.end(),
                        'text': cv_text[match.start():match.end()],
                        'type': 'skill_found',
                        'skill': skill,
                    })
        
        # Sort highlights by position
        highlights.sort(key=lambda x: x['start'])
        
        # Remove overlapping highlights (keep the first one)
        filtered_highlights = []
        last_end = -1
        for h in highlights:
            if h['start'] >= last_end:
                filtered_highlights.append(h)
                last_end = h['end']
        
        return Response({
            'job_title': job_title,
            'match_percentage': match_percentage,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'required_skills': all_required_skills,
            'cv_skills': cv_skills,
            'cv_experience_years': cv_experience,
            'cv_education': cv_education,
            'required_experience_years': required_experience,
            'experience_match': experience_match,
            'cv_text': cv_text,
            'highlights': filtered_highlights,
            'total_skills_found': len(cv_skills),
            'total_skills_matched': len(matched_skills),
            'total_skills_required': len(all_required_skills),
        })
