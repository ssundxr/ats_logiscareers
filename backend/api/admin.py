from django.contrib import admin
from .models import JobDescription, Candidate, Match


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ['title', 'company_name', 'location', 'experience_years', 'created_at']
    list_filter = ['company_name', 'experience_years', 'created_at']
    search_fields = ['title', 'company_name', 'raw_text']
    readonly_fields = ['raw_text', 'skills_required', 'created_at']
    ordering = ['-created_at']


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'experience_years', 'education_level', 'created_at']
    list_filter = ['education_level', 'experience_years', 'created_at']
    search_fields = ['name', 'email', 'raw_text']
    readonly_fields = ['raw_text', 'skills_extracted', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'job', 'match_percentage', 'semantic_score', 'matched_on']
    list_filter = ['job', 'matched_on']
    search_fields = ['candidate__name', 'job__title']
    readonly_fields = ['keyword_matches', 'matched_on']
    ordering = ['-match_percentage']
