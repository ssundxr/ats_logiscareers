"""
Serializers for the ATS API.
Handles serialization/deserialization of JobDescription, Candidate, and Match models.
"""

from rest_framework import serializers
from .models import JobDescription, Candidate, Match
from .utils import (
    extract_text_from_pdf,
    extract_skills,
    extract_experience_years,
    extract_education_level,
)


class JobDescriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for JobDescription model.
    Automatically extracts text and skills from uploaded PDF.
    """
    
    class Meta:
        model = JobDescription
        fields = [
            'id',
            'title',
            'company_name',
            'location',
            'file',
            'raw_text',
            'skills_required',
            'experience_years',
            'created_at',
        ]
        read_only_fields = ['id', 'raw_text', 'skills_required', 'created_at']
    
    def create(self, validated_data):
        """
        Override create to extract text and skills from PDF.
        """
        pdf_file = validated_data.get('file')
        
        if pdf_file:
            # Extract text from PDF
            raw_text = extract_text_from_pdf(pdf_file)
            validated_data['raw_text'] = raw_text
            
            # Extract skills from text
            skills = extract_skills(raw_text)
            validated_data['skills_required'] = skills
            
            # Extract experience years if not provided or is default
            if validated_data.get('experience_years', 0) == 0:
                experience = extract_experience_years(raw_text)
                if experience > 0:
                    validated_data['experience_years'] = int(experience)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Override update to re-extract text and skills if file changes.
        """
        pdf_file = validated_data.get('file')
        
        if pdf_file:
            # Extract text from new PDF
            raw_text = extract_text_from_pdf(pdf_file)
            validated_data['raw_text'] = raw_text
            
            # Extract skills from text
            skills = extract_skills(raw_text)
            validated_data['skills_required'] = skills
        
        return super().update(instance, validated_data)


class JobDescriptionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing job descriptions.
    """
    skills_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobDescription
        fields = [
            'id',
            'title',
            'company_name',
            'location',
            'experience_years',
            'skills_count',
            'created_at',
        ]
    
    def get_skills_count(self, obj):
        return len(obj.skills_required) if obj.skills_required else 0


class CandidateSerializer(serializers.ModelSerializer):
    """
    Serializer for Candidate model.
    Automatically extracts text, skills, experience, and education from uploaded CV.
    """
    
    class Meta:
        model = Candidate
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'file',
            'raw_text',
            'skills_extracted',
            'experience_years',
            'education_level',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'raw_text',
            'skills_extracted',
            'created_at',
            'updated_at',
        ]
    
    def create(self, validated_data):
        """
        Override create to extract text, skills, experience, and education from CV.
        """
        pdf_file = validated_data.get('file')
        
        if pdf_file:
            # Extract text from PDF
            raw_text = extract_text_from_pdf(pdf_file)
            validated_data['raw_text'] = raw_text
            
            # Extract skills from text
            skills = extract_skills(raw_text)
            validated_data['skills_extracted'] = skills
            
            # Extract experience years if not provided
            if validated_data.get('experience_years', 0.0) == 0.0:
                experience = extract_experience_years(raw_text)
                validated_data['experience_years'] = experience
            
            # Extract education level if not provided
            if not validated_data.get('education_level'):
                education = extract_education_level(raw_text)
                if education:
                    validated_data['education_level'] = education
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Override update to re-extract data if file changes.
        """
        pdf_file = validated_data.get('file')
        
        if pdf_file:
            # Extract text from new PDF
            raw_text = extract_text_from_pdf(pdf_file)
            validated_data['raw_text'] = raw_text
            
            # Extract skills from text
            skills = extract_skills(raw_text)
            validated_data['skills_extracted'] = skills
            
            # Re-extract experience if the current one is default
            if instance.experience_years == 0.0:
                experience = extract_experience_years(raw_text)
                validated_data['experience_years'] = experience
            
            # Re-extract education if not set
            if not instance.education_level:
                education = extract_education_level(raw_text)
                if education:
                    validated_data['education_level'] = education
        
        return super().update(instance, validated_data)


class CandidateListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing candidates.
    """
    skills_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'experience_years',
            'education_level',
            'skills_count',
            'created_at',
        ]
    
    def get_skills_count(self, obj):
        return len(obj.skills_extracted) if obj.skills_extracted else 0


class MatchSerializer(serializers.ModelSerializer):
    """
    Serializer for Match model.
    Includes nested job and candidate details.
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id',
            'job',
            'job_title',
            'company_name',
            'candidate',
            'candidate_name',
            'candidate_email',
            'match_percentage',
            'keyword_matches',
            'semantic_score',
            'matched_on',
        ]
        read_only_fields = ['id', 'matched_on']


class MatchListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing matches.
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id',
            'job_title',
            'candidate_name',
            'match_percentage',
            'semantic_score',
            'matched_on',
        ]


class MatchCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating matches.
    Automatically calculates match percentage based on skills.
    """
    
    class Meta:
        model = Match
        fields = [
            'id',
            'job',
            'candidate',
            'match_percentage',
            'keyword_matches',
            'semantic_score',
            'matched_on',
        ]
        read_only_fields = ['id', 'match_percentage', 'keyword_matches', 'matched_on']
    
    def create(self, validated_data):
        """
        Override create to calculate match percentage.
        """
        from .utils import calculate_skill_match
        
        job = validated_data['job']
        candidate = validated_data['candidate']
        
        # Calculate skill match
        match_percentage, keyword_matches = calculate_skill_match(
            job.skills_required,
            candidate.skills_extracted
        )
        
        validated_data['match_percentage'] = match_percentage
        validated_data['keyword_matches'] = keyword_matches
        
        # Set default semantic score if not provided
        if 'semantic_score' not in validated_data:
            validated_data['semantic_score'] = 0.0
        
        return super().create(validated_data)


class BulkMatchSerializer(serializers.Serializer):
    """
    Serializer for bulk matching a job against all candidates.
    """
    job_id = serializers.IntegerField()
    
    def validate_job_id(self, value):
        try:
            JobDescription.objects.get(pk=value)
        except JobDescription.DoesNotExist:
            raise serializers.ValidationError("Job description not found.")
        return value
