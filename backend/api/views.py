import os
import re
import PyPDF2
import docx
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from transformers import pipeline

# Load the zero-shot classification model
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
        print(f"Total extracted text length: {len(text)}")
        if len(text) == 0:
            print("Warning: No text extracted from PDF")
        print(f"First 100 characters: {text[:100]}")
        return text
    except Exception as e:
        print(f"Error in PDF extraction: {str(e)}")
        return ""

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        text = " ".join([paragraph.text for paragraph in doc.paragraphs])
        print(f"Total extracted text length: {len(text)}")
        if len(text) == 0:
            print("Warning: No text extracted from DOCX")
        print(f"First 100 characters: {text[:100]}")
        return text
    except Exception as e:
        print(f"Error in DOCX extraction: {str(e)}")
        return ""

def extract_skills(text):
    # This is a simple skill extraction. You might want to use a more sophisticated method or a pre-defined list of skills.
    skills_pattern = r'\b(Python|JavaScript|React|Django|HTML|CSS|Git|SQL|Machine Learning|AI|DevOps)\b'
    skills = re.findall(skills_pattern, text, re.IGNORECASE)
    return list(set(skills))  # Remove duplicates


class ResumeAnalysisView(APIView):
    def post(self, request):
        resume_file = request.FILES.get('resume')
        job_position = request.data.get('job_position')

        if not resume_file or not job_position:
            return Response({"error": "Both resume and job position are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_name = default_storage.save(resume_file.name, ContentFile(resume_file.read()))
            file_path = os.path.join(default_storage.location, file_name)

            if file_name.endswith('.pdf'):
                resume_text = extract_text_from_pdf(file_path)
            elif file_name.endswith('.docx'):
                resume_text = extract_text_from_docx(file_path)
            else:
                return Response({"error": "Invalid file format"}, status=status.HTTP_400_BAD_REQUEST)

            if not resume_text:
                return Response({"error": "Failed to extract text from the resume"}, status=status.HTTP_400_BAD_REQUEST)

            # Extract skills
            skills = extract_skills(resume_text)

            # Analyze the resume against the job position
            result = classifier(resume_text,
                                candidate_labels=[job_position, f"not {job_position}"],
                                hypothesis_template="This is a resume for a {}.")

            # Determine if the candidate passes based on the classification score
            confidence = result['scores'][0]
            passes = result['labels'][0] == job_position and confidence >= 0.8

            default_storage.delete(file_name)

            return Response({
                "passes": passes,
                "confidence": confidence,
                "job_position": job_position,
                "skills": skills,
                "pass_mark": 0.8
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error in resume analysis: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)