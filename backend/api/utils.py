"""
Utility functions for PDF text extraction and NLP-based skill extraction.
"""

import re
import spacy
from pdfminer.high_level import extract_text
from io import BytesIO


# Load SpaCy model (loaded once at module level for performance)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If model not found, download it
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


# Predefined list of common tech skills for accurate matching
TECH_SKILLS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "golang",
    "rust", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "bash", "shell",
    "powershell", "lua", "dart", "objective-c", "groovy", "cobol", "fortran", "haskell",
    
    # Web Frameworks & Libraries
    "django", "flask", "fastapi", "react", "reactjs", "react.js", "angular", "angularjs",
    "vue", "vuejs", "vue.js", "next.js", "nextjs", "nuxt", "nuxtjs", "express", "expressjs",
    "node", "nodejs", "node.js", "spring", "spring boot", "springboot", "laravel", "rails",
    "ruby on rails", "asp.net", ".net", "dotnet", "symfony", "codeigniter", "gatsby",
    "svelte", "ember", "backbone", "jquery", "bootstrap", "tailwind", "tailwindcss",
    "material-ui", "chakra", "ant design", "redux", "mobx", "graphql", "rest", "restful",
    
    # Databases
    "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
    "cassandra", "oracle", "sqlite", "mariadb", "dynamodb", "firebase", "firestore",
    "couchdb", "neo4j", "memcached", "mssql", "sql server", "aurora", "cockroachdb",
    
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
    "k8s", "jenkins", "terraform", "ansible", "puppet", "chef", "circleci", "travis ci",
    "github actions", "gitlab ci", "bitbucket", "heroku", "digitalocean", "vercel",
    "netlify", "cloudflare", "nginx", "apache", "linux", "ubuntu", "centos", "redhat",
    "windows server", "vmware", "vagrant", "prometheus", "grafana", "datadog", "splunk",
    "elk", "logstash", "kibana", "cloudformation", "pulumi", "helm", "istio", "argocd",
    
    # Data Science & ML
    "machine learning", "deep learning", "artificial intelligence", "ai", "ml",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
    "scipy", "matplotlib", "seaborn", "plotly", "jupyter", "anaconda", "opencv",
    "nlp", "natural language processing", "computer vision", "neural networks",
    "transformers", "hugging face", "bert", "gpt", "llm", "langchain", "openai",
    "spacy", "nltk", "xgboost", "lightgbm", "catboost", "spark", "pyspark", "hadoop",
    "hive", "kafka", "airflow", "mlflow", "kubeflow", "sagemaker", "databricks",
    
    # Mobile Development
    "android", "ios", "react native", "flutter", "xamarin", "ionic", "cordova",
    "swift ui", "swiftui", "jetpack compose", "mobile development",
    
    # Version Control & Collaboration
    "git", "github", "gitlab", "bitbucket", "svn", "mercurial", "jira", "confluence",
    "trello", "asana", "slack", "teams", "agile", "scrum", "kanban", "ci/cd", "cicd",
    
    # Testing
    "unit testing", "integration testing", "selenium", "cypress", "jest", "mocha",
    "pytest", "unittest", "testng", "junit", "postman", "swagger", "api testing",
    "load testing", "performance testing", "qa", "quality assurance", "tdd", "bdd",
    
    # Security
    "cybersecurity", "penetration testing", "owasp", "ssl", "tls", "oauth", "jwt",
    "encryption", "authentication", "authorization", "sso", "ldap", "active directory",
    
    # Other Technologies
    "microservices", "api", "websocket", "soap", "grpc", "rabbitmq", "celery",
    "asyncio", "multithreading", "concurrency", "design patterns", "oop",
    "functional programming", "data structures", "algorithms", "system design",
    "html", "css", "sass", "scss", "less", "webpack", "babel", "vite", "parcel",
    "npm", "yarn", "pip", "maven", "gradle", "make", "cmake", "json", "xml", "yaml",
    "csv", "excel", "power bi", "tableau", "looker", "etl", "data warehouse",
    "snowflake", "redshift", "bigquery", "dbt", "fivetran", "stitch",
]

# Convert to lowercase set for faster lookup
TECH_SKILLS_SET = set(skill.lower() for skill in TECH_SKILLS)


def extract_text_from_pdf(pdf_file):
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_file: A Django FileField file object or file-like object.
        
    Returns:
        str: Cleaned text extracted from the PDF.
    """
    try:
        # Read the file content into a BytesIO object
        if hasattr(pdf_file, 'read'):
            # Reset file pointer to beginning
            pdf_file.seek(0)
            file_content = pdf_file.read()
            pdf_file.seek(0)  # Reset again for potential future reads
        else:
            file_content = pdf_file
            
        # Create a BytesIO object for pdfminer
        pdf_bytes = BytesIO(file_content)
        
        # Extract text using pdfminer
        raw_text = extract_text(pdf_bytes)
        
        # Clean the extracted text
        cleaned_text = clean_text(raw_text)
        
        return cleaned_text
        
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def clean_text(text):
    """
    Clean extracted text by removing extra whitespace and normalizing.
    
    Args:
        text: Raw text string.
        
    Returns:
        str: Cleaned text.
    """
    if not text:
        return ""
    
    # Replace multiple whitespace/newlines with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Remove special characters that might interfere with processing
    # but keep punctuation that's useful for NLP
    text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\+\#\@\(\)\[\]\/]', '', text)
    
    return text


def extract_skills(text):
    """
    Extract technical skills from text using SpaCy NER and predefined skill matching.
    
    Args:
        text: Text content to analyze.
        
    Returns:
        list: List of unique skills found in the text.
    """
    if not text:
        return []
    
    found_skills = set()
    
    # Method 1: Match against predefined tech skills list
    text_lower = text.lower()
    
    # Check for each skill in our predefined list
    for skill in TECH_SKILLS:
        skill_lower = skill.lower()
        # Use word boundary matching to avoid partial matches
        # e.g., "java" shouldn't match "javascript"
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_lower):
            # Store the original casing from our list
            found_skills.add(skill)
    
    # Method 2: Use SpaCy NER for additional entity extraction
    doc = nlp(text[:100000])  # Limit text length for performance
    
    for ent in doc.ents:
        # Check if entity might be a tech skill
        if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
            ent_lower = ent.text.lower().strip()
            # Only add if it looks like a tech term (not too long, not too short)
            if 2 <= len(ent_lower) <= 30:
                # Check if it matches any of our known skills
                if ent_lower in TECH_SKILLS_SET:
                    found_skills.add(ent.text.strip())
    
    # Convert to sorted list for consistent output
    return sorted(list(found_skills), key=str.lower)


def extract_experience_years(text):
    """
    Extract years of experience from text.
    
    Args:
        text: Text content to analyze.
        
    Returns:
        float: Estimated years of experience, or 0.0 if not found.
    """
    if not text:
        return 0.0
    
    text_lower = text.lower()
    
    # Common patterns for years of experience
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)',
        r'(?:experience|exp)(?:\s*:)?\s*(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+(?:in|of|working))',
        r'(?:over|more than|approximately|about|around)\s*(\d+)\s*(?:years?|yrs?)',
    ]
    
    max_years = 0.0
    
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                years = float(match)
                if 0 < years <= 50:  # Reasonable range
                    max_years = max(max_years, years)
            except ValueError:
                continue
    
    return max_years


def extract_education_level(text):
    """
    Extract education level from text.
    
    Args:
        text: Text content to analyze.
        
    Returns:
        str: Education level code or None.
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Check from highest to lowest
    education_patterns = {
        'phd': [r'\bph\.?d\.?\b', r'\bdoctorate\b', r'\bdoctoral\b'],
        'master': [r'\bmaster\'?s?\b', r'\bm\.?s\.?\b', r'\bm\.?a\.?\b', r'\bmba\b', r'\bm\.?tech\b'],
        'bachelor': [r'\bbachelor\'?s?\b', r'\bb\.?s\.?\b', r'\bb\.?a\.?\b', r'\bb\.?tech\b', r'\bb\.?e\.?\b'],
        'associate': [r'\bassociate\'?s?\b', r'\ba\.?s\.?\b', r'\ba\.?a\.?\b'],
        'high_school': [r'\bhigh school\b', r'\bh\.?s\.?\b', r'\bdiploma\b', r'\bged\b'],
    }
    
    for level, patterns in education_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return level
    
    return None


def calculate_skill_match(job_skills, candidate_skills):
    """
    Calculate the percentage of job skills matched by candidate.
    
    Args:
        job_skills: List of skills required for the job.
        candidate_skills: List of skills the candidate has.
        
    Returns:
        tuple: (match_percentage, matched_skills_dict)
    """
    if not job_skills:
        return 0.0, {}
    
    job_skills_lower = set(s.lower() for s in job_skills)
    candidate_skills_lower = set(s.lower() for s in candidate_skills)
    
    matched = job_skills_lower.intersection(candidate_skills_lower)
    
    match_percentage = (len(matched) / len(job_skills_lower)) * 100
    
    # Create a dict showing which skills matched
    matched_skills = {
        skill: skill.lower() in matched
        for skill in job_skills
    }
    
    return round(match_percentage, 2), matched_skills
