"""
URL configuration for the ATS API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobDescriptionViewSet,
    CandidateViewSet,
    MatchViewSet,
    DashboardViewSet,
    CVScoreCheckerViewSet,
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'jobs', JobDescriptionViewSet, basename='job')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'matches', MatchViewSet, basename='match')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'cv-checker', CVScoreCheckerViewSet, basename='cv-checker')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
