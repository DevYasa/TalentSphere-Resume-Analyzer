from django.urls import path
from .views import ResumeAnalysisView

urlpatterns = [
    path('analyze-resume/', ResumeAnalysisView.as_view(), name='analyze_resume'),
]
