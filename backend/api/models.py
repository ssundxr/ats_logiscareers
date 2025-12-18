from django.db import models


class JobDescription(models.Model):
    """
    Stores job descriptions uploaded by recruiters.
    Supports NLP processing for skill extraction and matching.
    """
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='jds/')
    raw_text = models.TextField(blank=True)
    skills_required = models.JSONField(default=list)
    experience_years = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Job Description'
        verbose_name_plural = 'Job Descriptions'

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class Candidate(models.Model):
    """
    Stores candidate CVs/resumes.
    Supports NLP processing for skill extraction and matching.
    """
    EDUCATION_CHOICES = [
        ('high_school', 'High School'),
        ('associate', 'Associate Degree'),
        ('bachelor', "Bachelor's Degree"),
        ('master', "Master's Degree"),
        ('phd', 'PhD'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    file = models.FileField(upload_to='cvs/')
    raw_text = models.TextField(blank=True)
    skills_extracted = models.JSONField(default=list)
    experience_years = models.FloatField(default=0.0)
    education_level = models.CharField(
        max_length=50,
        choices=EDUCATION_CHOICES,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Candidate'
        verbose_name_plural = 'Candidates'

    def __str__(self):
        return f"{self.name} ({self.email})"


class Match(models.Model):
    """
    Stores matching results between JobDescriptions and Candidates.
    Supports both keyword-based and semantic (NLP) matching scores.
    """
    job = models.ForeignKey(
        JobDescription,
        on_delete=models.CASCADE,
        related_name='matches'
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='matches'
    )
    match_percentage = models.FloatField(
        help_text="Overall match percentage (0-100)"
    )
    keyword_matches = models.JSONField(
        default=dict,
        help_text="Dictionary of matched keywords and their relevance"
    )
    semantic_score = models.FloatField(
        default=0.0,
        help_text="Semantic similarity score from NLP model (0-1)"
    )
    matched_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_percentage', '-matched_on']
        verbose_name = 'Match'
        verbose_name_plural = 'Matches'
        unique_together = ['job', 'candidate']  # Prevent duplicate matches

    def __str__(self):
        return f"{self.candidate.name} → {self.job.title} ({self.match_percentage:.1f}%)"
