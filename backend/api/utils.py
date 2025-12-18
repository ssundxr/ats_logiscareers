"""
Utility functions for PDF text extraction and NLP-based skill extraction.
Enhanced with synonym matching, fuzzy matching, and weighted scoring.
"""

import re
import spacy
from pdfminer.high_level import extract_text
from io import BytesIO
from difflib import SequenceMatcher


# Load SpaCy model (loaded once at module level for performance)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If model not found, download it
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


# ============================================================================
# SKILL SYNONYMS - Maps variations to canonical skill names
# ============================================================================
SKILL_SYNONYMS = {
    # JavaScript variations
    "js": "javascript",
    "es6": "javascript",
    "es2015": "javascript",
    "ecmascript": "javascript",
    
    # TypeScript
    "ts": "typescript",
    
    # React variations
    "react.js": "react",
    "reactjs": "react",
    "react js": "react",
    
    # Vue variations
    "vue.js": "vuejs",
    "vue js": "vuejs",
    
    # Angular variations
    "angular.js": "angular",
    "angularjs": "angular",
    "angular js": "angular",
    
    # Node variations
    "node.js": "nodejs",
    "node js": "nodejs",
    "node": "nodejs",
    
    # Next.js variations
    "next.js": "nextjs",
    "next js": "nextjs",
    
    # Python variations
    "python3": "python",
    "python 3": "python",
    "py": "python",
    
    # PostgreSQL variations
    "postgres": "postgresql",
    "psql": "postgresql",
    "pg": "postgresql",
    
    # MongoDB variations
    "mongo": "mongodb",
    
    # Kubernetes variations
    "k8s": "kubernetes",
    "kube": "kubernetes",
    
    # Amazon Web Services
    "amazon web services": "aws",
    "amazon aws": "aws",
    
    # Google Cloud
    "google cloud platform": "gcp",
    "google cloud": "gcp",
    
    # Machine Learning
    "ml": "machine learning",
    "machine-learning": "machine learning",
    
    # Artificial Intelligence
    "artificial intelligence": "ai",
    
    # Deep Learning
    "dl": "deep learning",
    "deep-learning": "deep learning",
    
    # Natural Language Processing
    "natural language processing": "nlp",
    
    # C++ variations
    "cpp": "c++",
    "cplusplus": "c++",
    
    # C# variations
    "csharp": "c#",
    "c sharp": "c#",
    
    # .NET variations
    "dotnet": ".net",
    "dot net": ".net",
    
    # CI/CD variations
    "ci/cd": "cicd",
    "ci-cd": "cicd",
    "continuous integration": "cicd",
    "continuous deployment": "cicd",
    
    # API variations
    "rest api": "restful",
    "rest apis": "restful",
    "restful api": "restful",
    
    # Testing variations
    "unit test": "unit testing",
    "unit tests": "unit testing",
    "unittest": "unit testing",
    
    # Agile variations
    "agile methodology": "agile",
    "agile development": "agile",
    
    # OOP
    "object oriented programming": "oop",
    "object-oriented programming": "oop",
    "object oriented": "oop",
    
    # Data structures
    "data structure": "data structures",
    "dsa": "data structures",
    
    # Scikit-learn
    "scikit learn": "sklearn",
    "scikit-learn": "sklearn",
    
    # TensorFlow
    "tensor flow": "tensorflow",
    "tensor-flow": "tensorflow",
    
    # PyTorch
    "py torch": "pytorch",
    
    # FastAPI
    "fast api": "fastapi",
    "fast-api": "fastapi",
    
    # Spring Boot
    "springboot": "spring boot",
    "spring-boot": "spring boot",
    
    # Ruby on Rails
    "rails": "ruby on rails",
    "ror": "ruby on rails",
    
    # React Native
    "react-native": "react native",
    "reactnative": "react native",
    
    # Power BI
    "powerbi": "power bi",
    "power-bi": "power bi",
    
    # GitHub Actions
    "github-actions": "github actions",
    "gh actions": "github actions",
    
    # Experience level keywords
    "sr": "senior",
    "sr.": "senior",
    "jr": "junior",
    "jr.": "junior",
}

# Reverse synonym map for lookups
CANONICAL_TO_SYNONYMS = {}
for synonym, canonical in SKILL_SYNONYMS.items():
    if canonical not in CANONICAL_TO_SYNONYMS:
        CANONICAL_TO_SYNONYMS[canonical] = set()
    CANONICAL_TO_SYNONYMS[canonical].add(synonym)


# ============================================================================
# SKILL WEIGHTS - Some skills are more important/rare
# ============================================================================
SKILL_WEIGHTS = {
    # High-demand/specialized skills (weight: 1.5)
    "kubernetes": 1.5,
    "docker": 1.3,
    "aws": 1.4,
    "gcp": 1.4,
    "azure": 1.4,
    "terraform": 1.5,
    "machine learning": 1.5,
    "deep learning": 1.6,
    "pytorch": 1.5,
    "tensorflow": 1.5,
    "nlp": 1.5,
    "computer vision": 1.6,
    "microservices": 1.3,
    "system design": 1.4,
    "spark": 1.4,
    "kafka": 1.4,
    "elasticsearch": 1.3,
    "graphql": 1.3,
    "rust": 1.4,
    "go": 1.3,
    "scala": 1.3,
    
    # Common skills (weight: 1.0) - default
    # python, javascript, react, etc.
    
    # Very common/basic skills (weight: 0.8)
    "git": 0.8,
    "html": 0.7,
    "css": 0.7,
    "sql": 0.9,
    "agile": 0.8,
    "jira": 0.7,
    "slack": 0.5,
    "excel": 0.6,
}


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
    Enhanced with synonym normalization.
    
    Args:
        text: Text content to analyze.
        
    Returns:
        list: List of unique skills found in the text (normalized to canonical form).
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
            # Normalize to canonical form if it's a synonym
            canonical = SKILL_SYNONYMS.get(skill_lower, skill_lower)
            found_skills.add(canonical)
    
    # Method 2: Check for synonyms directly in text
    for synonym, canonical in SKILL_SYNONYMS.items():
        pattern = r'\b' + re.escape(synonym.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(canonical)
    
    # Method 3: Use SpaCy NER for additional entity extraction
    doc = nlp(text[:100000])  # Limit text length for performance
    
    for ent in doc.ents:
        # Check if entity might be a tech skill
        if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
            ent_lower = ent.text.lower().strip()
            # Only add if it looks like a tech term (not too long, not too short)
            if 2 <= len(ent_lower) <= 30:
                # Check if it matches any of our known skills
                if ent_lower in TECH_SKILLS_SET:
                    canonical = SKILL_SYNONYMS.get(ent_lower, ent_lower)
                    found_skills.add(canonical)
    
    # Convert to sorted list for consistent output
    return sorted(list(found_skills), key=str.lower)


def normalize_skill(skill):
    """
    Normalize a skill to its canonical form using synonyms.
    
    Args:
        skill: Skill string to normalize.
        
    Returns:
        str: Canonical form of the skill.
    """
    skill_lower = skill.lower().strip()
    return SKILL_SYNONYMS.get(skill_lower, skill_lower)


def fuzzy_match_skill(skill, skill_list, threshold=0.85):
    """
    Find the best fuzzy match for a skill in a list.
    
    Args:
        skill: Skill to match.
        skill_list: List of skills to match against.
        threshold: Minimum similarity ratio (0-1).
        
    Returns:
        tuple: (matched_skill, similarity_ratio) or (None, 0) if no match.
    """
    skill_lower = skill.lower()
    best_match = None
    best_ratio = 0
    
    for candidate in skill_list:
        candidate_lower = candidate.lower()
        
        # Exact match
        if skill_lower == candidate_lower:
            return candidate, 1.0
        
        # Check synonyms
        if normalize_skill(skill_lower) == normalize_skill(candidate_lower):
            return candidate, 1.0
        
        # Fuzzy match using SequenceMatcher
        ratio = SequenceMatcher(None, skill_lower, candidate_lower).ratio()
        if ratio > best_ratio and ratio >= threshold:
            best_match = candidate
            best_ratio = ratio
    
    return best_match, best_ratio


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
    Enhanced with synonym matching, fuzzy matching, and weighted scoring.
    
    Args:
        job_skills: List of skills required for the job.
        candidate_skills: List of skills the candidate has.
        
    Returns:
        tuple: (match_percentage, matched_skills_dict)
    """
    if not job_skills:
        return 0.0, {}
    
    # Normalize all skills to canonical form
    job_skills_normalized = {normalize_skill(s): s for s in job_skills}
    candidate_skills_normalized = {normalize_skill(s): s for s in candidate_skills}
    
    matched_skills = {}
    total_weight = 0
    matched_weight = 0
    
    for canonical, original in job_skills_normalized.items():
        # Get weight for this skill (default 1.0)
        weight = SKILL_WEIGHTS.get(canonical, 1.0)
        total_weight += weight
        
        # Check for exact match (after normalization)
        if canonical in candidate_skills_normalized:
            matched_skills[original] = True
            matched_weight += weight
        else:
            # Try fuzzy matching
            best_match, ratio = fuzzy_match_skill(
                canonical, 
                list(candidate_skills_normalized.keys()),
                threshold=0.85
            )
            if best_match:
                matched_skills[original] = True
                # Partial credit for fuzzy match
                matched_weight += weight * ratio
            else:
                matched_skills[original] = False
    
    # Calculate weighted percentage
    if total_weight > 0:
        match_percentage = (matched_weight / total_weight) * 100
    else:
        match_percentage = 0.0
    
    return round(match_percentage, 2), matched_skills


def calculate_skill_match_detailed(job_skills, candidate_skills):
    """
    Calculate detailed skill match with additional metrics.
    
    Args:
        job_skills: List of skills required for the job.
        candidate_skills: List of skills the candidate has.
        
    Returns:
        dict: Detailed matching results.
    """
    if not job_skills:
        return {
            'match_percentage': 0.0,
            'weighted_percentage': 0.0,
            'matched_skills': [],
            'missing_skills': [],
            'extra_skills': [],
            'fuzzy_matches': [],
            'skill_details': {}
        }
    
    # Normalize skills
    job_normalized = {normalize_skill(s): s for s in job_skills}
    candidate_normalized = {normalize_skill(s): s for s in candidate_skills}
    
    matched = []
    missing = []
    fuzzy_matches = []
    skill_details = {}
    
    total_weight = 0
    matched_weight = 0
    
    for canonical, original in job_normalized.items():
        weight = SKILL_WEIGHTS.get(canonical, 1.0)
        total_weight += weight
        
        detail = {
            'skill': original,
            'canonical': canonical,
            'weight': weight,
            'matched': False,
            'match_type': None,
            'matched_with': None,
            'similarity': 0
        }
        
        if canonical in candidate_normalized:
            matched.append(original)
            matched_weight += weight
            detail['matched'] = True
            detail['match_type'] = 'exact'
            detail['matched_with'] = candidate_normalized[canonical]
            detail['similarity'] = 1.0
        else:
            # Try fuzzy matching
            best_match, ratio = fuzzy_match_skill(
                canonical,
                list(candidate_normalized.keys()),
                threshold=0.80
            )
            if best_match:
                matched.append(original)
                matched_weight += weight * ratio
                fuzzy_matches.append({
                    'required': original,
                    'found': candidate_normalized.get(best_match, best_match),
                    'similarity': ratio
                })
                detail['matched'] = True
                detail['match_type'] = 'fuzzy'
                detail['matched_with'] = candidate_normalized.get(best_match, best_match)
                detail['similarity'] = ratio
            else:
                missing.append(original)
        
        skill_details[original] = detail
    
    # Find extra skills candidate has
    extra = []
    for canonical, original in candidate_normalized.items():
        if canonical not in job_normalized:
            # Check if not already matched via fuzzy
            already_matched = any(
                fm['found'].lower() == original.lower() 
                for fm in fuzzy_matches
            )
            if not already_matched:
                extra.append(original)
    
    # Calculate percentages
    simple_percentage = (len(matched) / len(job_skills)) * 100 if job_skills else 0
    weighted_percentage = (matched_weight / total_weight) * 100 if total_weight > 0 else 0
    
    return {
        'match_percentage': round(simple_percentage, 2),
        'weighted_percentage': round(weighted_percentage, 2),
        'matched_skills': matched,
        'missing_skills': missing,
        'extra_skills': extra,
        'fuzzy_matches': fuzzy_matches,
        'skill_details': skill_details,
        'total_required': len(job_skills),
        'total_matched': len(matched),
        'total_candidate_skills': len(candidate_skills)
    }
