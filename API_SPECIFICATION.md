# Gemini API Specification

## Overview
All these APIs should:
- ✅ Require authentication (Bearer token in Authorization header)
- ✅ Accept POST requests
- ✅ Use Gemini API internally to process requests
- ✅ Return JSON responses

---

## 1. Analyze Resume & Job Match

**Endpoint:** `POST /api/gemini/analyze-resume`

**Purpose:** Analyze how well resume matches job description

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resume": "John Doe\nSoftware Engineer...",
  "jobDescription": "Senior Engineer required...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "matchPercentage": 78,
  "atsScore": 85,
  "missingSkills": ["Kubernetes", "Docker", "CI/CD"],
  "matchedSkills": ["Python", "React", "Node.js"],
  "strengths": ["Strong backend experience", "Good communication"],
  "weaknesses": ["Limited DevOps experience", "No cloud experience"],
  "suggestions": [
    "Add Kubernetes experience to skills",
    "Highlight any cloud projects",
    "Expand on deployment experience"
  ],
  "creditsUsed": 1
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

## 2. Extract Resume from Document

**Endpoint:** `POST /api/gemini/extract-resume`

**Purpose:** Extract structured resume data from raw text (from document upload)

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "documentText": "JOHN DOE\nEmail: john@example.com\nPython Developer with 5 years...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "location": "San Francisco, CA",
    "website": "johndoe.com",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  },
  "summary": "Experienced Python developer specializing in backend systems...",
  "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
  "experience": [
    {
      "title": "Senior Developer",
      "company": "Tech Company",
      "location": "San Francisco, CA",
      "startDate": "2020-01",
      "endDate": "2024-01",
      "isCurrentlyWorking": false,
      "description": [
        "Led team of 5 developers",
        "Built microservices architecture"
      ]
    }
  ],
  "education": [
    {
      "institution": "Stanford University",
      "degree": "Bachelor",
      "field": "Computer Science",
      "graduationDate": "2018-05",
      "gpa": "3.8",
      "achievements": ["Dean's List", "Scholarship"]
    }
  ],
  "projects": [
    {
      "title": "E-Commerce Platform",
      "description": "Built full-stack e-commerce platform",
      "technologies": ["Python", "React", "PostgreSQL"],
      "link": "github.com/johndoe/ecommerce",
      "date": "2023"
    }
  ],
  "certifications": ["AWS Solutions Architect", "Kubernetes CKA"],
  "creditsUsed": 2
}
```

---

## 3. Tailor Resume for Job

**Endpoint:** `POST /api/gemini/tailor-resume`

**Purpose:** Generate a tailored resume optimized for specific job description

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resume": "John Doe\nSoftware Engineer...",
  "jobDescription": "We are looking for Senior Backend Engineer...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "tailoredResume": "JOHN DOE\nEmail: john@example.com\n\nPROFESSIONAL SUMMARY\nExperienced Backend Engineer with strong expertise in...\n\nKEY SKILLS\nBackend Development: Python, FastAPI, Node.js\nDatabase: PostgreSQL, MongoDB, Redis\nCloud & DevOps: AWS, Docker, Kubernetes\n...",
  "optimizationNotes": [
    "Reordered skills to match job requirements",
    "Highlighted backend experience prominently",
    "Emphasized cloud architecture work",
    "Removed irrelevant frontend projects"
  ],
  "estimatedATSScore": 87,
  "creditsUsed": 2
}
```

---

## 4. Calculate ATS Score

**Endpoint:** `POST /api/gemini/ats-score`

**Purpose:** Analyze resume's ATS compatibility and provide improvement suggestions

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resume": "John Doe\nSoftware Engineer...",
  "jobDescription": "Senior Engineer required...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "atsScore": 85,
  "scoreBreakdown": {
    "formatting": 90,
    "keywords": 80,
    "structure": 88,
    "relevance": 82
  },
  "improvements": [
    {
      "issue": "Missing 'Agile' keyword",
      "suggestion": "Add 'Agile/Scrum' to skills section",
      "impact": "Will increase score by 5 points"
    },
    {
      "issue": "Dates format inconsistent",
      "suggestion": "Use consistent date format: MM/YYYY",
      "impact": "Will increase score by 3 points"
    }
  ],
  "topMissingKeywords": [
    "Kubernetes",
    "CI/CD",
    "Microservices",
    "RESTful APIs"
  ],
  "creditsUsed": 1
}
```

---

## 5. Parse Job Description

**Endpoint:** `POST /api/gemini/parse-job`

**Purpose:** Extract structured data from job description (skills, requirements, etc.)

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "jobDescription": "Senior Backend Engineer required...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "jobTitle": "Senior Backend Engineer",
  "company": "Tech Company",
  "requiredSkills": [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "AWS"
  ],
  "preferredSkills": [
    "Kubernetes",
    "Docker",
    "Redis"
  ],
  "experience": "5+ years backend development",
  "education": "Bachelor in Computer Science",
  "salaryRange": "$120,000 - $180,000",
  "jobType": "Full-time",
  "location": "Remote",
  "description": "We are looking for...",
  "responsibilities": [
    "Design and implement scalable APIs",
    "Mentor junior developers",
    "Lead architectural decisions"
  ],
  "creditsUsed": 1
}
```

---

## 6. Generate Cover Letter

**Endpoint:** `POST /api/gemini/generate-cover-letter`

**Purpose:** Generate a tailored cover letter based on resume and job description

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resume": "John Doe\nSoftware Engineer...",
  "jobDescription": "Senior Backend Engineer required...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "coverLetter": "Dear Hiring Manager,\n\nI am excited to apply for the Senior Backend Engineer position...",
  "creditsUsed": 3
}
```

---

## 7. Check Resume Completeness

**Endpoint:** `POST /api/gemini/check-completeness`

**Purpose:** Analyze how complete the resume is and suggest what's missing

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resume": "John Doe\nSoftware Engineer...",
  "userCredits": 5
}
```

**Response (Success - 200):**
```json
{
  "completenessScore": 78,
  "sections": {
    "contact": { "present": true, "score": 100 },
    "summary": { "present": true, "score": 85 },
    "skills": { "present": true, "score": 90 },
    "experience": { "present": true, "score": 80 },
    "education": { "present": true, "score": 75 },
    "projects": { "present": false, "score": 0 },
    "certifications": { "present": false, "score": 0 }
  },
  "missing": [
    "Projects section",
    "Certifications",
    "Portfolio link"
  ],
  "suggestions": [
    "Add 2-3 notable projects you've worked on",
    "List relevant certifications",
    "Include portfolio or GitHub link"
  ],
  "creditsUsed": 1
}
```

---

## Common Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing fields, invalid data) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient credits) |
| 500 | Server error (Gemini API error, etc.) |

**Error Response Format:**
```json
{
  "error": "Error type",
  "message": "Detailed message",
  "code": "ERROR_CODE"
}
```

---

## Error Examples

**400 - Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Resume text is required",
  "code": "MISSING_RESUME"
}
```

**401 - Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired authentication token",
  "code": "INVALID_TOKEN"
}
```

**403 - Insufficient Credits:**
```json
{
  "error": "Insufficient Credits",
  "message": "User has 2 credits but API requires 5 credits",
  "code": "INSUFFICIENT_CREDITS"
}
```

**500 - Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to process request with Gemini API",
  "code": "GEMINI_ERROR"
}
```

---

## Authentication

**Header:** `Authorization: Bearer {auth_token}`

Example:
```
POST /api/gemini/analyze-resume
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "resume": "...",
  "jobDescription": "..."
}
```

---

## Credit System

Each API call deducts credits from user account:
- **analyze-resume**: 1 credit
- **extract-resume**: 2 credits
- **tailor-resume**: 2 credits
- **ats-score**: 1 credit
- **parse-job**: 1 credit
- **generate-cover-letter**: 3 credits
- **check-completeness**: 1 credit

Return `creditsUsed` in every response so frontend can update UI.

---

## Extension Usage

Extension should:
1. Get `auth_token` from `chrome.storage.sync`
2. Check if token exists (if not, show "Login required")
3. Call any of these APIs with the token
4. Deduct credits from UI based on `creditsUsed` in response
5. Display results in extension popup

Example extension call:
```javascript
const token = await chrome.storage.sync.get('auth_token');
const response = await fetch('https://yourapp.com/api/gemini/analyze-resume', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token.auth_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    resume: selectedText,
    jobDescription: jobDesc
  })
});
const data = await response.json();
console.log('ATS Score:', data.atsScore);
```

---

## Summary

You need to create these 7 endpoints:
1. ✅ `/api/gemini/analyze-resume` - Match resume to job
2. ✅ `/api/gemini/extract-resume` - Parse resume from text
3. ✅ `/api/gemini/tailor-resume` - Optimize resume for job
4. ✅ `/api/gemini/ats-score` - Get ATS compatibility
5. ✅ `/api/gemini/parse-job` - Extract job requirements
6. ✅ `/api/gemini/generate-cover-letter` - Generate cover letter
7. ✅ `/api/gemini/check-completeness` - Check resume gaps

**All should:**
- Require authentication (Bearer token)
- Call Gemini API internally
- Return credits used in response
- Handle errors properly
