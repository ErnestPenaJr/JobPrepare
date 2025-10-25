# Program Requirements Prompt (PRP)

**Project:** Job Application Analyzer - Resume vs Job Description Matcher  
**Version:** 2.0 (Generic/Multi-User)  
**Purpose:** A web application that helps job seekers objectively assess their qualification for positions by comparing their resume and cover letter against job descriptions through multi-perspective scoring analysis.

---

## Executive Summary

**What it does:**
- Analyzes resume + optional cover letter against any job description
- Scores qualification through 10 distinct evaluation perspectives (1-10 scale)
- Identifies gaps, missing skills, and improvement areas
- Generates tailored cover letters without fabrication
- Provides actionable feedback for job seekers

**Core Value Proposition:**
Save time, increase self-awareness, avoid applying to poor-fit roles, improve application materials.

---

## 1. User Personas & Use Cases

### Primary Persona: Active Job Seeker
- **Need:** Objective assessment before applying
- **Pain:** Wasting time on poor-fit applications
- **Goal:** Apply only where 80%+ qualified

### Secondary Persona: Career Transitioner
- **Need:** Understand transferable skills
- **Pain:** Uncertainty about qualification for new domains
- **Goal:** Identify skill gaps and learning paths

### Use Cases
1. Quick check: "Am I qualified?" (Yes/No + score)
2. Deep analysis: "What's missing?" (Gap report)
3. Application prep: "Tailor my cover letter" (Generated content)
4. Batch processing: "Compare against 5 jobs" (v2 feature)

---

## 2. Functional Requirements

### 2.1 Document Ingestion

**Supported Inputs:**

**Job Description:**
- **Job ID/URL** (NEW - Recommended): Paste job URL or ID, system auto-fetches details
  - LinkedIn: `linkedin.com/jobs/view/123456789`
  - Indeed: `indeed.com/viewjob?jk=abc123xyz`
  - Greenhouse: `boards.greenhouse.io/company/jobs/123456`
  - Lever: `jobs.lever.co/company/role-name`
  - Direct job ID: `linkedin:123456789` or `indeed:abc123xyz`
- Pasted text (fallback if API fails)
- File upload: PDF, DOCX, TXT, Markdown
- Generic URL fetch: Company career pages (with fallback to manual paste)

**Resume:**
- File upload: PDF, DOCX, TXT
- Supports multi-page, various formats
- Max size: 5MB

**Cover Letter (Optional):**
- File upload or pasted text
- If provided, included in analysis
- If not provided, can be generated

**Parsing Requirements:**
- Extract clean text from PDF/DOCX (preserve structure where possible)
- Normalize whitespace, bullets, headers
- Handle OCR'd/scanned documents (best effort)
- Detect sections: "Requirements", "Responsibilities", "Qualifications", etc.
- Extract metadata: company name, job title, location, posted date

### 2.2 User Preferences (Optional Configuration)

Allow users to set personal constraints/deal-breakers:

**Location Preferences:**
- Excluded locations (e.g., "No CA, NY")
- Required flexibility (e.g., "Must allow remote")
- Max days on-site per week

**Experience Constraints:**
- Max years required (e.g., "I only have 5 years, don't show 10+ year roles")
- Management scope (e.g., "No people management roles")

**Role Type Exclusions:**
- Keywords to avoid (e.g., "manufacturing", "warehouse")
- Role types to skip (e.g., "DevOps-only", "QA-only", "PM-only")

**Tech Stack Preferences:**
- Deal-breaker technologies (e.g., "No COBOL/Mainframe")
- Preferred/required flexibility in stack

**Default Behavior:**
If no preferences set, analyze ALL jobs (show warnings but don't auto-reject).

---

## 3. Analysis Engine

### 3.1 Job Description Understanding

**Extract from JD:**

**Required Skills** (MUST have):
- Programming languages with proficiency level
- Frameworks, libraries, tools
- Methodologies (Agile, TDD, etc.)
- Certifications

**Preferred Skills** (NICE to have):
- Secondary languages/frameworks
- Domain knowledge
- Soft skills

**Experience Requirements:**
- Years of experience (min/max)
- Leadership/management expectations
- Seniority level (Junior, Mid, Senior, Staff, Principal)

**Constraints:**
- Location (city, state, country)
- Work arrangement (on-site/hybrid/remote, days per week)
- Travel requirements
- Visa sponsorship availability

**Role Characteristics:**
- Primary responsibilities (development, architecture, leadership, etc.)
- Tech stack (frontend, backend, full-stack, data, infra)
- Domain/industry
- Company size and stage

**Output Format (JSON):**
```json
{
  "job": {
    "title": "Senior Full Stack Developer",
    "company": "TechCorp Inc.",
    "location": {
      "city": "Austin",
      "state": "TX",
      "remote": "hybrid",
      "days_on_site": 2
    },
    "requirements": {
      "must_have_skills": ["React", "Node.js", "PostgreSQL", "REST APIs", "Git"],
      "nice_to_have_skills": ["TypeScript", "GraphQL", "AWS", "Docker"],
      "years_required": {"min": 5, "max": null},
      "education": "Bachelor's in CS or equivalent experience",
      "certifications": []
    },
    "responsibilities": [
      "Build scalable web applications",
      "Collaborate with product and design teams",
      "Mentor junior developers"
    ],
    "tech_stack": {
      "primary": ["React", "Node.js", "PostgreSQL"],
      "secondary": ["Redis", "Kafka", "Kubernetes"]
    },
    "role_type": "full_stack_development",
    "seniority": "senior",
    "management_required": false
  }
}
```

### 3.2 Resume Understanding

**Extract from Resume:**

**Skills Inventory:**
- Programming languages (with years of experience if stated)
- Frameworks, tools, platforms
- Databases, cloud services
- Soft skills (leadership, communication, etc.)

**Experience Timeline:**
- Total years of professional experience
- Years per technology/skill (inferred from job dates + descriptions)
- Roles held (Developer, Lead, Manager, etc.)
- Industries/domains worked in

**Projects & Achievements:**
- Notable projects with tech stack
- Quantifiable achievements
- Open source contributions, publications

**Education & Certifications:**
- Degrees, institutions
- Certifications, courses

**Work Preferences (if stated):**
- Desired location/work arrangement
- Career objectives

**Output Format (JSON):**
```json
{
  "candidate": {
    "skills": {
      "languages": [
        {"name": "JavaScript", "years": 6, "proficiency": "expert"},
        {"name": "Python", "years": 3, "proficiency": "intermediate"}
      ],
      "frameworks": ["React", "Express", "Django", "jQuery"],
      "tools": ["Git", "Docker", "Jenkins", "Jira"],
      "databases": ["PostgreSQL", "MySQL", "MongoDB"],
      "cloud": ["AWS", "Azure"],
      "soft_skills": ["team leadership", "mentoring", "agile methodologies"]
    },
    "experience": {
      "total_years": 7,
      "current_seniority": "senior",
      "management_experience": false,
      "domains": ["fintech", "healthcare", "e-commerce"]
    },
    "education": {
      "degrees": ["BS Computer Science, University of Texas"],
      "certifications": ["AWS Certified Developer"]
    },
    "preferences": {
      "remote": true,
      "willing_to_relocate": false
    }
  }
}
```

---

## 4. Scoring System

### 4.1 Core Principle: Multi-Perspective Evaluation

**Why 10 iterations?**
Different hiring managers prioritize different aspects. By evaluating from 10 distinct perspectives and averaging, we:
- Reduce single-dimension bias
- Capture holistic qualification
- Identify consistent strengths/weaknesses

### 4.2 Dynamic Iteration Generation

**Instead of hardcoded weights, dynamically generate 10 perspectives based on the JD:**

**Perspective 1: Core Technical Skills**
- Weight by must-have technologies in JD
- Highest weight to primary stack
- Example: If JD emphasizes React + Node.js, score heavily on those

**Perspective 2: Extended Technical Skills**
- Include nice-to-have skills
- Secondary frameworks, tools
- Bonus for exceeding requirements

**Perspective 3: Experience Depth**
- Years of experience alignment
- Seniority level match
- Career progression trajectory

**Perspective 4: Domain Expertise**
- Industry/domain overlap
- Relevant project experience
- Transferable knowledge

**Perspective 5: Role Fit**
- Responsibilities match (IC vs Lead vs Manager)
- Work style (independent vs collaborative)
- Company stage fit (startup vs enterprise)

**Perspective 6: Learning Agility**
- Evidence of skill acquisition
- Transitions to new technologies
- Breadth of tech exposure

**Perspective 7: Keyword Match (Strict)**
- Binary: has exact required skills or not
- Penalty for missing must-haves
- Reward for having all nice-to-haves

**Perspective 8: Constraint Compatibility**
- Location/remote match
- Work arrangement fit
- Availability alignment

**Perspective 9: Cultural/Soft Skills**
- Leadership, communication, collaboration
- Methodologies (Agile, TDD)
- Team dynamics

**Perspective 10: Holistic Balance**
- Equal weighting across all dimensions
- "Generalist hiring manager" view
- Safety check against over-specialization bias

### 4.3 Scoring Algorithm

**For each perspective:**

1. **Identify relevant factors** from JD (e.g., "Perspective 1 cares about React, Node.js, PostgreSQL")

2. **Check candidate match** for each factor:
   - Full match (has skill + sufficient experience) = 1.0
   - Partial match (has skill but less experience) = 0.5-0.9
   - Transferable skill (related but not exact) = 0.3-0.6
   - No match = 0.0

3. **Calculate sub-scores:**
   ```python
   for factor in perspective_factors:
       match_level = check_candidate_match(factor, candidate)
       sub_score += weight[factor] * match_level
   
   # Normalize to 0-1 range
   normalized = sub_score / sum(weights)
   
   # Map to 1-10 scale
   perspective_score = 1 + (normalized * 9)
   ```

4. **Store iteration result**

**After 10 iterations:**

```python
final_score = sum(iteration_scores) / 10
# Round to 1 decimal place
final_score = round(final_score, 1)
```
### 4.3.2 Word Comparison Scoring Algorithm

**Purpose:** Analyze textual overlap between job description and resume to measure alignment through common meaningful words.

**Implementation:**

1. **Word Extraction**
   - Extract meaningful words from both JD and resume text
   - Filter out stop words (common words like "the", "and", "is", etc.)
   - Include only words with 3+ characters containing letters
   - Normalize to lowercase for comparison
   - Preserve technical terms (e.g., "c#", "node.js", "python")

2. **Common Words Identification**
   - Compare extracted words from JD and resume
   - Count frequency of each word in both documents
   - Identify words that appear in both texts
   - Sort by total frequency (JD count + resume count)

3. **10-Iteration Scoring Process**
   
   For each of 10 iterations, calculate three component scores:
   
   **a) Base Score:** `common_words / jd_words`
   - Measures what percentage of JD words appear in resume
   
   **b) Frequency Score:** `sum(min(jd_freq, resume_freq)) / jd_words`
   - Weights by how often words appear in both documents
   - Rewards repeated mentions of key terms
   
   **c) Coverage Score:** `common_words / resume_words`
   - Measures how much of resume is relevant to JD
   
   **Iteration Weighting Strategies:**
   ```
   Iteration 1:  [0.50, 0.30, 0.20]  # Favor base match
   Iteration 2:  [0.40, 0.40, 0.20]  # Balanced
   Iteration 3:  [0.30, 0.50, 0.20]  # Favor frequency
   Iteration 4:  [0.30, 0.30, 0.40]  # Favor coverage
   Iteration 5:  [0.40, 0.30, 0.30]  # Balanced
   Iteration 6:  [0.50, 0.25, 0.25]  # Favor base
   Iteration 7:  [0.35, 0.40, 0.25]  # Favor frequency
   Iteration 8:  [0.30, 0.40, 0.30]  # Balanced
   Iteration 9:  [0.40, 0.35, 0.25]  # Mixed
   Iteration 10: [0.33, 0.33, 0.34]  # Equal weights
   ```
   
   **Per-Iteration Calculation:**
   ```javascript
   // Combine scores with iteration-specific weights
   rawScore = (baseScore * w1) + (freqScore * w2) + (coverageScore * w3)
   
   // Add ±5% random variation for each iteration
   variation = 1 + (random() * 0.1 - 0.05)
   rawScore = rawScore * variation
   
   // Map to 1-10 scale
   iterationScore = 1 + (min(1, rawScore) * 9)
   ```

4. **Final Average Score**
   ```javascript
   averageScore = sum(all_10_iterations) / 10
   // Round to 2 decimal places
   averageScore = round(averageScore, 2)
   ```

**Output Format:**

```json
{
  "word_comparison": {
    "iterations": [4.88, 4.77, 4.65, 4.73, 4.59, 4.5, 4.87, 4.52, 4.72, 4.45],
    "average": 4.67,
    "common_words": [
      {
        "word": "python",
        "jd_count": 3,
        "resume_count": 1,
        "total": 4
      },
      {
        "word": "django",
        "jd_count": 2,
        "resume_count": 2,
        "total": 4
      }
      // ... up to 50 most common words
    ],
    "stats": {
      "jd_words": 24,
      "resume_words": 30,
      "common_words": 10
    }
  }
}
```

**Interpretation:**
- **Score 8.0-10.0**: Excellent textual alignment, strong keyword overlap
- **Score 6.0-7.9**: Good alignment, most key terms present
- **Score 4.0-5.9**: Moderate alignment, some gaps in terminology
- **Score 1.0-3.9**: Weak alignment, significant vocabulary mismatch

**Use Cases:**
- Supplement primary qualification scoring
- Identify specific terminology gaps
- Validate resume optimization for ATS systems
- Guide resume keyword improvements

### 4.4 Validation Re-Evaluation

**If final_score >= 8.0:**
- Run ONE additional evaluation with slightly perturbed weights (±5-10% random)
- Calculate delta: `|re_eval_score - final_score|`
- If delta > 0.5: Flag as "unstable" and show both scores
- If delta ≤ 0.5: Confirm score is stable

**Purpose:** Reduce false positives from edge cases or overfitting.

### 4.5 Threshold Interpretation

| Score Range | Interpretation | Recommendation |
|-------------|----------------|----------------|
| 9.0 - 10.0 | Excellent fit | Strongly apply |
| 8.0 - 8.9 | Good fit | Apply with confidence |
| 7.0 - 7.9 | Moderate fit | Apply if interested; highlight transferable skills |
| 6.0 - 6.9 | Marginal fit | Consider after skill development |
| 5.0 - 5.9 | Weak fit | Not recommended unless willing to learn significantly |
| 1.0 - 4.9 | Poor fit | Look for better-aligned roles |

---

## 5. Stop Conditions & Warnings

### 5.1 Philosophy Change: Guidance, Not Gatekeeping

**Old approach:** Hard rejections based on rigid rules  
**New approach:** Tiered warnings based on user preferences + objective analysis

### 5.2 Scoring-Based Guidance

**Automatic Messages:**

- **Score < 6.0**: "Based on analysis, this role may not be a strong fit. Consider roles better aligned with your current skills."
- **Score 6.0-7.9**: "You meet some but not all requirements. Consider applying if you're willing to learn on the job."
- **Score 8.0+**: "You appear well-qualified. Proceed with application."

### 5.3 User Preference Warnings (Optional)

**Only show if user has set preferences AND job violates them:**

Example: User set "No manufacturing" → Job contains "plant operations"
```
⚠️ Preference Warning: This job matches your excluded keyword "manufacturing"
```

Example: User set "Max 3 days on-site" → Job requires 5 days
```
⚠️ Location Warning: This role requires 5 days/week on-site, exceeding your preference of 3 days maximum
```

**User can dismiss warnings or adjust preferences.**

### 5.4 Objective Red Flags (Show but don't block)

**Experience Mismatch:**
```
⚠️ Experience Gap: Role requires 8+ years; you have 5 years
```

**Critical Skill Missing:**
```
⚠️ Missing Core Skill: Role requires "Kubernetes" expertise (not found in resume)
```

**Tech Stack Mismatch:**
```
⚠️ Tech Stack Alert: Role uses "COBOL/Mainframe"; you have no mainframe experience
```

**Role Type Mismatch:**
```
⚠️ Role Type: This is primarily a QA/Testing position; your background is in development
```

**Always allow user to proceed** - system provides information, not barriers.

---

## 6. Gap Analysis & Recommendations

### 6.1 Skills Gap Report

**Output:**
```json
{
  "missing_required_skills": [
    {
      "skill": "Kubernetes",
      "importance": "high",
      "alternatives_you_have": ["Docker (related)"],
      "learning_resources": ["kubernetes.io tutorial", "Udemy course link"]
    }
  ],
  "missing_preferred_skills": [
    {
      "skill": "GraphQL",
      "importance": "medium",
      "would_boost_score_by": 0.4
    }
  ],
  "experience_gaps": [
    {
      "area": "Years of experience",
      "required": 7,
      "you_have": 5,
      "impact": "May be viewed as less experienced"
    }
  ],
  "strengths": [
    "Strong React experience exceeds requirements",
    "Node.js expertise aligns perfectly",
    "Relevant e-commerce domain experience"
  ]
}
```

### 6.2 Actionable Recommendations

**Short-term (before applying):**
- "Add 'Docker' to resume if you've used it in projects"
- "Quantify your React experience (e.g., 'Built 10+ production apps')"
- "Highlight your AWS certification in summary section"

**Medium-term (1-3 months):**
- "Consider taking a Kubernetes course to fill critical gap"
- "Contribute to open-source GraphQL project to gain experience"
- "Build a portfolio project showcasing full-stack capabilities"

**Long-term (3-6 months):**
- "Pursue AWS Solutions Architect certification"
- "Transition to more senior IC role to meet experience threshold"

---

## 7. Cover Letter Generation

### 7.1 Trigger Conditions

**Only offer cover letter generation if:**
- Final score ≥ 7.0 (at least moderate fit)
- User is on Starter tier or higher (Free tier cannot generate)

**User can provide (optional):**
- Existing cover letter to be revised/improved
- Or generate from scratch based on resume alone

### 7.2 LLM Provider: ChatGPT (OpenAI API)

**Required:**
- Use OpenAI ChatGPT API (GPT-4 or GPT-3.5-turbo)
- Model selection based on tier:
  - **Free tier**: N/A (feature locked)
  - **Starter tier**: GPT-3.5-turbo (faster, cheaper)
  - **Pro/Career tier**: GPT-4 (higher quality)
- Temperature: 0.7 (creative but controlled)
- Max tokens: 1500 (sufficient for ~400-500 word letter)

### 7.3 Generation Rules (CRITICAL)

**Absolute Rules:**
1. **NO FABRICATION**: Only include skills/experience explicitly in the resume
2. **NO EXAGGERATION**: If resume says "1 year Python," don't claim "extensive Python expertise"
3. **NO ASSUMPTIONS**: Don't infer skills from related ones (e.g., knows React → claims Next.js)
4. **VERIFICATION**: Cross-reference every claim against resume JSON
5. **USE EXISTING CONTENT**: If user provides existing cover letter, incorporate their voice, style, and key points

**Three-Input Strategy:**
When user provides an existing cover letter:
- **Preserve**: Their writing style, tone, personal anecdotes, specific achievements they highlighted
- **Enhance**: Align better with job requirements, add relevant skills from resume
- **Improve**: Strengthen weak sections, fix grammar, improve flow
- **Never**: Change their core message or remove personal touches

### 7.4 ChatGPT Prompt Template

#### **Scenario A: Revise Existing Cover Letter**

```
SYSTEM PROMPT:
You are an expert career counselor helping job seekers improve their cover letters. Your role is to revise existing cover letters to better align with specific job descriptions while maintaining the candidate's authentic voice and style.

CRITICAL RULES:
1. NEVER fabricate skills, experiences, or qualifications
2. ONLY reference information explicitly stated in the provided resume
3. Preserve the candidate's writing style and personal touches
4. If the existing cover letter mentions something not in the resume, flag it for removal
5. Use today's date: {current_date}

USER PROMPT:
Please revise this cover letter for the following job, incorporating information from the candidate's resume.

JOB DESCRIPTION:
---
{job_description_text}

Key Requirements Extracted:
- Title: {job_title}
- Company: {company_name}
- Required Skills: {must_have_skills}
- Preferred Skills: {nice_to_have_skills}
- Years Required: {years_required}
- Location: {location}
---

CANDIDATE'S RESUME (verified facts only):
---
Name: {candidate_name}
Skills: {skills_list}
Years of Experience: {total_years}
Recent Roles:
{recent_jobs_with_dates}

Key Projects/Achievements:
{achievements_list}

Education: {education}
Certifications: {certifications}
---

EXISTING COVER LETTER TO REVISE:
---
{existing_cover_letter_text}
---

TASK:
Revise the above cover letter to:
1. Keep the candidate's voice, tone, and personal style
2. Better highlight skills that match the job requirements (from resume only)
3. Incorporate relevant achievements from resume that weren't in original letter
4. Improve structure and flow while maintaining authenticity
5. Use today's date: {current_date}
6. Keep length ~350-450 words
7. Remove any claims not supported by the resume

VERIFICATION CHECK:
Before finalizing, ensure every skill or experience mentioned exists in the "CANDIDATE'S RESUME" section above.

OUTPUT FORMAT:
Return the revised cover letter as plain text, ready to use.
```

#### **Scenario B: Generate from Scratch**

```
SYSTEM PROMPT:
You are an expert career counselor helping job seekers write compelling cover letters. Your role is to create tailored cover letters that highlight genuine qualifications while maintaining authenticity.

CRITICAL RULES:
1. NEVER fabricate skills, experiences, or qualifications
2. ONLY reference information explicitly stated in the provided resume
3. Write in a professional but personable tone
4. Focus on achievements and how they relate to the job
5. Use today's date: {current_date}

USER PROMPT:
Write a compelling cover letter for the following job based on the candidate's resume.

JOB DESCRIPTION:
---
{job_description_text}

Key Requirements Extracted:
- Title: {job_title}
- Company: {company_name}
- Required Skills: {must_have_skills}
- Preferred Skills: {nice_to_have_skills}
- Years Required: {years_required}
- Location: {location}
---

CANDIDATE'S RESUME (verified facts only):
---
Name: {candidate_name}
Skills: {skills_list}
Years of Experience: {total_years}
Recent Roles:
{recent_jobs_with_dates}

Key Projects/Achievements:
{achievements_list}

Education: {education}
Certifications: {certifications}
---

TASK:
Create a professional cover letter that:
1. Opens with enthusiasm for the specific role and company
2. Highlights 2-3 key qualifications that match job requirements (from resume only)
3. Includes a specific achievement or project that demonstrates relevant skills
4. Shows understanding of the role's responsibilities
5. Closes with a call to action
6. Uses today's date: {current_date}
7. Keeps length ~350-450 words
8. Maintains professional yet personable tone

STRUCTURE:
Paragraph 1: Opening - role interest, brief qualification summary
Paragraph 2: Technical fit - match 2-3 key required skills with resume experience
Paragraph 3: Relevant experience - highlight specific project/achievement
Paragraph 4: Motivation & fit - why this company/role interests you
Paragraph 5: Closing - express enthusiasm, request interview

VERIFICATION CHECK:
Before finalizing, ensure every skill or experience mentioned exists in the "CANDIDATE'S RESUME" section above.

OUTPUT FORMAT:
Return the cover letter as plain text, ready to use.
```

### 7.5 API Implementation

```javascript
// Cover Letter Generation Service
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateCoverLetter({
  jobDescription,
  candidateResume,
  existingCoverLetter = null,
  userTier = 'pro'
}) {
  // Select model based on user tier
  const model = userTier === 'starter' ? 'gpt-3.5-turbo' : 'gpt-4';
  
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Prepare prompt based on whether existing cover letter provided
  const systemPrompt = existingCoverLetter 
    ? getRevisionSystemPrompt() 
    : getGenerationSystemPrompt();
  
  const userPrompt = existingCoverLetter
    ? buildRevisionPrompt(jobDescription, candidateResume, existingCoverLetter, currentDate)
    : buildGenerationPrompt(jobDescription, candidateResume, currentDate);
  
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    });
    
    const generatedLetter = completion.choices[0].message.content;
    
    // Verify no fabrication (post-generation check)
    const verificationResult = await verifyNoFabrication(
      generatedLetter, 
      candidateResume
    );
    
    if (!verificationResult.passed) {
      console.warn('Verification warnings:', verificationResult.warnings);
    }
    
    return {
      coverLetter: generatedLetter,
      model: model,
      tokensUsed: completion.usage.total_tokens,
      verificationWarnings: verificationResult.warnings,
      date: currentDate
    };
    
  } catch (error) {
    console.error('Cover letter generation failed:', error);
    throw new Error('Unable to generate cover letter. Please try again.');
  }
}

// Verification: Check if letter mentions skills not in resume
async function verifyNoFabrication(coverLetter, candidateResume) {
  const warnings = [];
  
  // Extract technical skills mentioned in letter
  const letterSkills = extractSkillsFromText(coverLetter);
  const resumeSkills = candidateResume.skills.map(s => s.toLowerCase());
  
  // Check for skills in letter that aren't in resume
  for (const skill of letterSkills) {
    const skillLower = skill.toLowerCase();
    const isInResume = resumeSkills.some(rs => 
      rs.includes(skillLower) || skillLower.includes(rs)
    );
    
    if (!isInResume) {
      warnings.push(`Letter mentions "${skill}" which is not in resume`);
    }
  }
  
  return {
    passed: warnings.length === 0,
    warnings: warnings
  };
}

// Helper: Build prompt for revision
function buildRevisionPrompt(jd, resume, existingLetter, date) {
  return `
Please revise this cover letter for the following job, incorporating information from the candidate's resume.

JOB DESCRIPTION:
---
${jd.description}

Key Requirements:
- Title: ${jd.title}
- Company: ${jd.company}
- Required Skills: ${jd.requirements.must_have.join(', ')}
- Preferred Skills: ${jd.requirements.nice_to_have.join(', ')}
- Years Required: ${jd.requirements.years_required}
---

CANDIDATE'S RESUME:
---
Name: ${resume.name}
Skills: ${resume.skills.join(', ')}
Years of Experience: ${resume.experience.total_years}

Recent Roles:
${resume.experience.jobs.slice(0, 3).map(job => 
  `- ${job.title} at ${job.company} (${job.dates})\n  ${job.description}`
).join('\n')}

Key Achievements:
${resume.achievements.slice(0, 3).map(a => `- ${a}`).join('\n')}

Education: ${resume.education}
---

EXISTING COVER LETTER TO REVISE:
---
${existingLetter}
---

TASK:
Revise the cover letter to better align with the job requirements while preserving the candidate's voice. Use today's date: ${date}

Keep length ~350-450 words. Only reference skills/experiences from the resume above.
`.trim();
}

// Helper: Build prompt for generation from scratch
function buildGenerationPrompt(jd, resume, date) {
  return `
Write a compelling cover letter for the following job based on the candidate's resume.

JOB DESCRIPTION:
---
${jd.description}

Key Requirements:
- Title: ${jd.title}
- Company: ${jd.company}
- Required Skills: ${jd.requirements.must_have.join(', ')}
- Preferred Skills: ${jd.requirements.nice_to_have.join(', ')}
- Years Required: ${jd.requirements.years_required}
---

CANDIDATE'S RESUME:
---
Name: ${resume.name}
Skills: ${resume.skills.join(', ')}
Years of Experience: ${resume.experience.total_years}

Recent Roles:
${resume.experience.jobs.slice(0, 3).map(job => 
  `- ${job.title} at ${job.company} (${job.dates})\n  ${job.description}`
).join('\n')}

Key Achievements:
${resume.achievements.slice(0, 3).map(a => `- ${a}`).join('\n')}

Education: ${resume.education}
---

TASK:
Create a professional cover letter (~350-450 words) that:
1. Opens with enthusiasm for the role
2. Highlights 2-3 matching qualifications from resume
3. Includes a relevant achievement
4. Shows company/role fit
5. Closes with call to action

Use today's date: ${date}
Only reference skills/experiences from the resume above.
`.trim();
}
```

### 7.6 Letter Structure

**Generated cover letters should follow this structure:**

```markdown
[Today's Date]

Hiring Manager
[Company Name]
[City, State] (if known)

Dear Hiring Manager,

**Paragraph 1: Opening (2-3 sentences)**
- Express genuine interest in specific role
- Brief statement of qualification
- Hook to continue reading

**Paragraph 2: Technical Fit (3-4 sentences)**
- Match 2-3 key required skills to resume experience
- Use specific examples from work history
- Quantify achievements where possible

**Paragraph 3: Relevant Experience (3-4 sentences)**
- Highlight 1-2 specific projects or achievements
- Demonstrate problem-solving and impact
- Show alignment with role responsibilities

**Paragraph 4: Motivation & Fit (2-3 sentences)**
- Why this company/role specifically
- How your goals align with company mission
- What you bring beyond technical skills

**Paragraph 5: Closing (2 sentences)**
- Express enthusiasm for opportunity
- Request for interview/next steps
- Thank them for consideration

Sincerely,
[Candidate Name]
```

### 7.7 User Interface Flow

**Step 1: Analysis Complete (Score ≥ 7.0)**
```
✅ Analysis Complete! Score: 8.2/10

You appear well-qualified for this role.

[Generate Cover Letter] button appears
```

**Step 2: Cover Letter Options**
```
┌─────────────────────────────────────────┐
│  Generate Cover Letter                  │
├─────────────────────────────────────────┤
│                                         │
│  ○ Generate from scratch                │
│     Create a new cover letter based     │
│     on your resume                      │
│                                         │
│  ○ Revise my existing cover letter     │
│     Upload or paste your current letter │
│     [Upload File] or [Paste Text]      │
│                                         │
│  Quality:                               │
│  • Starter: Standard (GPT-3.5)         │
│  • Pro/Career: Premium (GPT-4) ⭐       │
│                                         │
│  [Cancel]  [Generate →]                │
└─────────────────────────────────────────┘
```

**Step 3: Generation in Progress**
```
Generating your cover letter...
├─ Analyzing job requirements... ✓
├─ Matching your experience... ✓
├─ Crafting personalized content... ⏳
└─ Verifying accuracy...

This may take 15-30 seconds.
```

**Step 4: Review & Edit**
```
┌─────────────────────────────────────────┐
│  Your Cover Letter                      │
├─────────────────────────────────────────┤
│                                         │
│  [Cover letter text appears here]       │
│  [Editable textarea]                    │
│                                         │
│  ⚠️ Verification:                       │
│  Please review to ensure all claims are │
│  accurate and match your resume.        │
│                                         │
│  [Copy to Clipboard]  [Download PDF]   │
│  [Regenerate]         [Save]           │
└─────────────────────────────────────────┘
```

### 7.8 Token Management

**Input Token Estimation:**
- Job description: ~500-1500 tokens
- Resume summary: ~300-800 tokens
- Existing cover letter: ~200-600 tokens
- Prompt template: ~400 tokens
- **Total input**: ~1400-3300 tokens

**Output Token Allocation:**
- Target letter: ~400-500 words = ~600-750 tokens
- Buffer: ~250 tokens
- **Max output**: 1500 tokens

**Cost per Generation:**
- GPT-3.5-turbo: ~$0.01-0.02 per letter
- GPT-4: ~$0.10-0.15 per letter

### 7.9 Error Handling

**Scenario: OpenAI API Error**
```javascript
if (error.code === 'rate_limit_exceeded') {
  return {
    error: 'We\'re experiencing high demand. Please try again in a few moments.',
    retry: true
  };
}

if (error.code === 'insufficient_quota') {
  // Internal issue - alert admins
  alertAdmins('OpenAI quota exhausted');
  return {
    error: 'Cover letter generation temporarily unavailable. Please try again later.',
    retry: false
  };
}
```

**Scenario: Verification Warnings**
```javascript
if (verificationWarnings.length > 0) {
  return {
    coverLetter: generatedLetter,
    warnings: verificationWarnings,
    message: 'Please review: Some claims may need verification against your resume.'
  };
}
```

### 7.10 Quality Assurance

**Post-Generation Checks:**
1. **Length**: 300-500 words (flag if outside range)
2. **Date**: Includes current date in correct format
3. **Personalization**: Mentions company name and job title
4. **Skills**: Only references skills from resume
5. **Structure**: Has opening, body, and closing paragraphs
6. **Tone**: Professional but not overly formal

**User Feedback Loop:**
```
Was this cover letter helpful?
👍 Yes, used it  👎 No, too generic  💬 Needs work

[Optional: What would you change?]
```

---

## 8. User Interface (UI/UX)

### 8.1 Layout: 3-Column Responsive Design

**Column 1: Inputs** (collapsible on mobile)
- Drag-and-drop file upload zones
- Text paste areas
- URL input for JD
- User preferences panel (optional)

**Column 2: Analysis Results** (main focus)
- Score meter (1-10 visual gauge)
- Iteration breakdown (expandable table)
- Gap analysis
- Warnings/flags
- Keyword match visualization

**Column 3: Actions** (sidebar)
- Export PDF/Markdown buttons
- Generate Cover Letter (if eligible)
- Save Analysis (for logged-in users)
- Share Link (optional)

### 8.2 Key UI Components

**Score Visualization:**
```
┌──────────────────────────────┐
│  Your Qualification Score    │
│                               │
│    ████████░░ 8.2/10         │
│                               │
│  Good Fit - Apply with       │
│  Confidence                   │
└──────────────────────────────┘
```

**Iteration Breakdown (Expandable Table):**
```
┌────────────────────────────────────────┐
│ Scoring Iterations          [Show All] │
├────────────────────────────────────────┤
│ 1. Core Technical Skills        8.5    │
│ 2. Extended Technical Skills    7.8    │
│ 3. Experience Depth             8.0    │
│ 4. Domain Expertise             8.7    │
│ ... (click to see all 10)              │
├────────────────────────────────────────┤
│ Final Average:                  8.2    │
│ Re-evaluation:                  8.3 ✓  │
└────────────────────────────────────────┘
```

**Gap Analysis Accordion:**
```
▼ Missing Required Skills (2)
  ⚠️ Kubernetes - High Priority
     You have: Docker (related)
     Suggestion: Take k8s course [link]
  
  ⚠️ GraphQL - Medium Priority
     Would boost score by: 0.4 points
     Suggestion: Build sample project

▼ Experience Gaps (1)
  ℹ️ 7 years required, you have 5
     Impact: May need to emphasize rapid growth

▼ Your Strengths (4)
  ✓ Strong React expertise (exceeds requirements)
  ✓ Relevant e-commerce domain experience
  ...
```

**Keyword Match Heatmap:**
```
Required Skills Match:  7/10 ███████░░░ 70%
Preferred Skills Match: 4/8  █████░░░░░ 50%
Overall Keyword Match:  11/18 ██████░░░░ 61%

Matched: React, Node.js, PostgreSQL, Git, Agile, AWS, REST
Missing: Kubernetes, GraphQL, TypeScript
```

### 8.3 Accessibility Requirements

- **WCAG 2.1 AA compliant**
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader compatible (ARIA labels)
- High contrast mode support
- Focus indicators on interactive elements
- Alt text for all visual score indicators
- Skip-to-content links

### 8.4 Mobile Responsive

- Stack columns vertically on <768px screens
- Touch-friendly upload zones
- Collapsible sections to reduce scrolling
- Bottom-anchored action buttons

---

## 9. Technical Architecture

### 9.1 System Components

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼──────────────────────┐
│   Frontend (React + TS)     │
│   - File upload UI          │
│   - Results visualization   │
│   - Export functionality    │
└──────┬──────────────────────┘
       │ REST API
┌──────▼──────────────────────┐
│   Backend (Node.js/Python)  │
│   - Document parser         │
│   - Analysis orchestrator   │
│   - LLM integration         │
└──────┬──────────────────────┘
       │
   ┌───┴───┐
   │       │
┌──▼───┐ ┌─▼──────┐
│ LLM  │ │ Storage│
│ API  │ │ (S3)   │
└──────┘ └────────┘
```

### 9.2 Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- React Hook Form for inputs
- Recharts for score visualizations
- React PDF for export

**Backend:**
- Node.js (Express/Fastify) OR Python (FastAPI)
- Document parsers:
  - `pdf-parse` or `pdfjs-dist` for PDF
  - `mammoth` for DOCX
  - `marked` for Markdown
- Job API clients:
  - Axios or Fetch for HTTP requests
  - Cheerio (for HTML parsing/scraping)
  - URL parsing library
- LLM SDK: OpenAI, Anthropic, or compatible
- Session management: Redis or JWT

**Storage:**
- Transient: In-memory for demo/free tier
- Cache: Redis (for job data, 24hr TTL)
- Persistent: AWS S3, Cloudflare R2, or similar
- Database: PostgreSQL (for user accounts, saved analyses)

**Infrastructure:**
- Hosting: Vercel, Netlify (frontend) + Railway, Fly.io (backend)
- CDN: Cloudflare
- Rate limiting: Upstash Redis
- Monitoring: Sentry, LogRocket

### 9.3 API Design

**Base URL:** `https://api.jobanalyzer.app/v1`

#### POST `/job/fetch`

**Request:**
```json
{
  "url": "https://www.linkedin.com/jobs/view/3234567890",
  "user_id": "uuid (optional, for quota tracking)"
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "job_id": "linkedin:3234567890",
    "source": "linkedin",
    "title": "Senior Full Stack Developer",
    "company": {
      "name": "TechCorp Inc.",
      "logo_url": "https://...",
      "website": "https://techcorp.com"
    },
    "location": {
      "city": "Austin",
      "state": "TX",
      "country": "US",
      "remote": "hybrid",
      "days_onsite": 2
    },
    "description": "Full job description text...",
    "requirements": {
      "must_have": ["React", "Node.js", "5+ years"],
      "nice_to_have": ["TypeScript", "AWS"]
    },
    "salary": {
      "min": 120000,
      "max": 180000,
      "currency": "USD",
      "period": "annual"
    },
    "posted_date": "2025-09-15",
    "apply_url": "https://..."
  },
  "fetch_method": "jsearch_api",
  "cached": false
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "quota_exceeded",
  "message": "API limit reached. Please paste job description manually or upgrade to Pro.",
  "fallback": true
}
```

#### POST `/analyze`

**Request:**
```json
{
  "job_description": {
    "text": "string (if pasted)",
    "file_id": "uuid (if uploaded)",
    "url": "string (if URL provided - will fetch automatically)",
    "job_id": "string (if previously fetched, e.g., 'linkedin:123456')"
  },
  "resume": {
    "text": "string",
    "file_id": "uuid"
  },
  "cover_letter": {
    "text": "string (optional)",
    "file_id": "uuid (optional)"
  },
  "user_preferences": {
    "excluded_keywords": ["manufacturing", "warehouse"],
    "max_days_onsite": 3,
    "min_remote_days": 2,
    "excluded_locations": ["CA", "NY"],
    "max_years_required": null
  }
}
```

**Note:** Job description can be provided in 4 ways:
1. `text` - manually pasted job description
2. `file_id` - uploaded PDF/DOCX file
3. `url` - job URL to fetch automatically
4. `job_id` - reference to previously fetched job (from cache)

**Response:**
```json
{
  "analysis_id": "uuid",
  "scorecard": {
    "iterations": [8.5, 7.8, 8.0, 8.7, 8.1, 7.9, 8.4, 8.2, 8.3, 8.0],
    "final_score": 8.2,
    "re_evaluation": {
      "score": 8.3,
      "delta": 0.1,
      "stable": true
    }
  },
  "gaps": {
    "missing_required": [
      {
        "skill": "Kubernetes",
        "importance": "high",
        "alternatives": ["Docker"],
        "learning_resources": ["https://k8s.io"]
      }
    ],
    "missing_preferred": [...],
    "experience_gaps": [...],
    "strengths": [...]
  },
  "keywords": {
    "required_match": {"matched": ["React", "Node.js"], "missing": ["Kubernetes"]},
    "preferred_match": {"matched": ["AWS"], "missing": ["GraphQL"]},
    "match_percentage": 65
  },
  "warnings": [
    {
      "type": "user_preference",
      "severity": "info",
      "message": "Job requires 4 days on-site, your preference is 3 days max"
    }
  ],
  "recommendation": "good_fit",
  "can_generate_cover_letter": true
}
```

#### POST `/cover-letter`

**Request:**
```json
{
  "analysis_id": "uuid",
  "existing_cover_letter": "string (optional)",
  "preferences": {
    "tone": "professional|enthusiastic|formal",
    "length": "short|medium|long",
    "emphasis": ["technical_skills", "domain_experience", "leadership"]
  }
}
```

**Response:**
```json
{
  "cover_letter": "string (markdown)",
  "verification_warnings": [
    "Verify that claim about 'React expertise' matches your resume"
  ],
  "claimed_skills": ["React", "Node.js", "AWS"],
  "date_generated": "2025-10-03"
}
```

#### GET `/export/{analysis_id}`

**Query Params:** `?format=pdf|markdown|json`

**Response:** Binary file download or JSON

---

## 10. Scoring Implementation Details

### 10.1 Skill Matching Algorithm

```python
def match_skill(candidate_skills, required_skill):
    """
    Returns a score 0.0-1.0 indicating match quality
    """
    # Exact match
    if required_skill.lower() in [s.lower() for s in candidate_skills]:
        return 1.0
    
    # Synonym match
    synonyms = get_synonyms(required_skill)  # e.g., "Node.js" -> ["NodeJS", "Node"]
    if any(syn in candidate_skills for syn in synonyms):
        return 1.0
    
    # Related skill (transferable)
    related = get_related_skills(required_skill)  # e.g., "React" -> ["Vue", "Angular"]
    if any(rel in candidate_skills for rel in related):
        return 0.6
    
    # Family match (weaker)
    family = get_skill_family(required_skill)  # e.g., "PostgreSQL" -> ["MySQL", "MongoDB"]
    if any(fam in candidate_skills for fam in family):
        return 0.4
    
    return 0.0
```

### 10.2 Experience Calculation

```python
def calculate_years(candidate, skill):
    """
    Conservative estimation of years with a skill
    """
    # Explicit mention in resume
    if skill in candidate.years_by_skill:
        return candidate.years_by_skill[skill]
    
    # Infer from job history
    years = 0
    for job in candidate.jobs:
        if skill in job.technologies:
            years += job.duration_years
    
    # Cap at total experience
    return min(years, candidate.total_years)
```

### 10.3 Dynamic Weight Generation

```python
def generate_perspective_weights(jd):
    """
    Create 10 distinct weight sets based on JD priorities
    """
    weights = []
    
    # Perspective 1: Core technical skills
    core_weights = {}
    for skill in jd.required_skills[:5]:  # Top 5 required
        core_weights[skill] = 0.15
    core_weights['experience_years'] = 0.15
    weights.append(normalize_weights(core_weights))
    
    # Perspective 2: Extended technical skills
    extended_weights = {}
    for skill in jd.required_skills + jd.preferred_skills[:3]:
        extended_weights[skill] = 0.10
    extended_weights['breadth'] = 0.20
    weights.append(normalize_weights(extended_weights))
    
    # ... (generate remaining 8 perspectives)
    
    return weights
```

### 10.4 Scoring Each Perspective

```python
def score_perspective(candidate, jd, weights):
    """
    Calculate score for one perspective (1-10 scale)
    """
    sub_scores = {}
    
    for factor, weight in weights.items():
        if factor == 'experience_years':
            # Normalize years: 0 years = 0, JD requirement = 1.0
            required_years = jd.years_required or 5
            candidate_years = candidate.total_years
            normalized = min(candidate_years / required_years, 1.0)
            sub_scores[factor] = normalized
        
        elif factor in ['skill', 'framework', 'tool']:
            # Use skill matching
            match = match_skill(candidate.skills, factor)
            sub_scores[factor] = match
        
        elif factor == 'domain':
            # Domain overlap
            overlap = len(set(candidate.domains) & set(jd.domains))
            normalized = overlap / max(len(jd.domains), 1)
            sub_scores[factor] = normalized
        
        # ... (other factors)
    
    # Weighted sum
    total = sum(weight * sub_scores.get(factor, 0) for factor, weight in weights.items())
    
    # Map to 1-10 scale
    perspective_score = 1 + (total * 9)
    
    return round(perspective_score, 1)
```

---

## 12. Job API Integration

### 12.1 Overview

Instead of manual copy-paste, users can simply provide a job URL or ID, and the system automatically fetches structured job data from major job boards and ATS platforms.

**Benefits:**
- ✅ Faster user experience (paste URL → instant analysis)
- ✅ More accurate data (structured from source)
- ✅ Consistent formatting across job boards
- ✅ Automatic updates if job posting changes
- ✅ Additional metadata (salary, benefits, company info)

### 12.2 Supported Job Sources

#### **Tier 1: Free APIs with Good Coverage**

**1. Adzuna API** (Free tier: 1000 calls/month)
- **Coverage:** US, UK, Canada, Australia, Europe
- **Endpoint:** `https://api.adzuna.com/v1/api/jobs/{country}/details/{job_id}`
- **Data Quality:** ⭐⭐⭐⭐ (Excellent)
- **Includes:** Title, company, location, description, salary, contract type, category
- **API Key:** Free registration at adzuna.com/developers
- **Rate Limit:** 1000 requests/month free, then $0.01/request

**2. JSearch API (RapidAPI)** (Free tier: 250 calls/month)
- **Coverage:** Global aggregator (Indeed, LinkedIn, ZipRecruiter, etc.)
- **Endpoint:** `https://jsearch.p.rapidapi.com/job-details`
- **Data Quality:** ⭐⭐⭐⭐⭐ (Excellent, real-time)
- **Includes:** Full job details, company info, apply link, posted date
- **API Key:** Free on RapidAPI (requires account)
- **Rate Limit:** 250/month free, then paid tiers

**3. Remotive API** (Free, no limits)
- **Coverage:** Remote-only tech jobs
- **Endpoint:** `https://remotive.io/api/remote-jobs/{job_id}`
- **Data Quality:** ⭐⭐⭐ (Good for remote roles)
- **Includes:** Title, company, description, tags, salary (if disclosed)
- **API Key:** None required (public API)
- **Rate Limit:** None stated (reasonable use)

**4. The Muse API** (Free tier: 500 calls/day)
- **Coverage:** US-focused, curated companies
- **Endpoint:** `https://www.themuse.com/api/public/jobs/{job_id}`
- **Data Quality:** ⭐⭐⭐⭐ (High-quality, detailed)
- **Includes:** Rich job details, company culture info, benefits
- **API Key:** Free registration required
- **Rate Limit:** 500 requests/day

#### **Tier 2: Scraping Services (Freemium)**

**5. SerpApi (Google Jobs Scraper)** (Free tier: 100 searches/month)
- **Coverage:** Global (scrapes Google Jobs)
- **Endpoint:** `https://serpapi.com/search.json?engine=google_jobs&q=job_id`
- **Data Quality:** ⭐⭐⭐⭐ (Depends on source)
- **Includes:** Whatever Google Jobs displays
- **API Key:** Free 100 searches/month
- **Rate Limit:** 100/month free, then $50/month for 5000

**6. ScraperAPI** (Free tier: 1000 calls/month)
- **Coverage:** Universal (can scrape any job board)
- **Endpoint:** Custom based on target URL
- **Data Quality:** ⭐⭐⭐ (Raw HTML, requires parsing)
- **Includes:** Full page HTML
- **API Key:** Free 1000 requests/month
- **Rate Limit:** 1000/month free

#### **Tier 3: Direct Integrations (No API, URL parsing only)**

**7. LinkedIn Jobs** (No official free API)
- **Method:** Scrape public job pages (via ScraperAPI or manual)
- **URL Pattern:** `linkedin.com/jobs/view/{job_id}`
- **Limitations:** Rate-limited, may break if LinkedIn changes HTML
- **Fallback:** Always offer manual paste

**8. Indeed** (No official free API)
- **Method:** Scrape public job pages
- **URL Pattern:** `indeed.com/viewjob?jk={job_id}`
- **Limitations:** Bot detection, inconsistent structure
- **Fallback:** Always offer manual paste

**9. ATS Platforms (Public job boards)**
- **Greenhouse:** `boards.greenhouse.io/{company}/jobs/{job_id}`
- **Lever:** `jobs.lever.co/{company}/{job_slug}`
- **Workable:** `apply.workable.com/{company}/j/{job_id}`
- **Method:** Parse public HTML (no API needed)
- **Data Quality:** ⭐⭐⭐⭐ (Structured, reliable)

### 12.3 Job ID Extraction & URL Parsing

**System must intelligently extract job IDs from various URL formats:**

```javascript
// URL Parsing Examples
const jobUrlPatterns = {
  linkedin: /linkedin\.com\/jobs\/view\/(\d+)/,
  indeed: /indeed\.com\/viewjob\?jk=([a-zA-Z0-9]+)/,
  greenhouse: /greenhouse\.io\/[^/]+\/jobs\/(\d+)/,
  lever: /lever\.co\/([^/]+)\/([^/?]+)/,
  workable: /workable\.com\/[^/]+\/j\/([A-Z0-9]+)/,
  adzuna: /adzuna\.(com|co\.uk)\/jobs\/details\/(\d+)/,
  remotive: /remotive\.(io|com)\/remote-jobs\/[^/]+\/([^/?]+)/,
  themuse: /themuse\.com\/jobs\/[^/]+\/([^/?]+)/
};

function parseJobUrl(url) {
  for (const [source, pattern] of Object.entries(jobUrlPatterns)) {
    const match = url.match(pattern);
    if (match) {
      return {
        source: source,
        jobId: match[1] || match[2], // Adjust based on pattern
        originalUrl: url
      };
    }
  }
  
  // Generic fallback: try to fetch as regular URL
  return {
    source: 'generic',
    jobId: null,
    originalUrl: url
  };
}
```

**User Input Examples:**
- `https://www.linkedin.com/jobs/view/3234567890` → Extract `linkedin:3234567890`
- `indeed.com/viewjob?jk=abc123xyz` → Extract `indeed:abc123xyz`
- Just paste: `3234567890` with dropdown to select source → User specifies "LinkedIn"

### 12.4 Integration Architecture

```
┌─────────────────────────────────┐
│   User Input (URL or Job ID)   │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Job ID Extractor             │
│   - Parse URL                   │
│   - Identify source             │
│   - Extract job ID              │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Check Cache                   │
│   - Redis: job_id → job_data    │
│   - TTL: 24 hours               │
└────────────┬────────────────────┘
             │
         Cache Hit? 
        ┌────┴────┐
        │         │
       YES       NO
        │         │
        │    ┌────▼─────────────────────┐
        │    │  API Router              │
        │    │  - Select best API       │
        │    │  - Try primary source    │
        │    │  - Fallback chain        │
        │    └────┬─────────────────────┘
        │         │
        │    ┌────▼─────────────────────┐
        │    │  API Call(s)             │
        │    │  - Adzuna / JSearch      │
        │    │  - ScraperAPI (fallback) │
        │    │  - Direct scrape (last)  │
        │    └────┬─────────────────────┘
        │         │
        │    ┌────▼─────────────────────┐
        │    │  Data Normalizer         │
        │    │  - Map to standard schema│
        │    │  - Extract key fields    │
        │    │  - Clean/validate        │
        │    └────┬─────────────────────┘
        │         │
        │    ┌────▼─────────────────────┐
        │    │  Cache Result            │
        │    │  - Store for 24hrs       │
        │    └────┬─────────────────────┘
        │         │
        └────┬────┘
             │
┌────────────▼────────────────────┐
│   Return Structured Job Data   │
│   - Standard JSON format        │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Analysis Engine (existing)   │
│   - Parse job requirements      │
│   - Run 10 iterations           │
└─────────────────────────────────┘
```

### 12.5 API Response Normalization

**Challenge:** Different APIs return different structures. We need a standard format.

**Our Standard Job Schema:**
```json
{
  "job_id": "string (source:id format, e.g., linkedin:123456)",
  "source": "linkedin|indeed|greenhouse|adzuna|jsearch|remotive|themuse",
  "source_url": "string (original job posting URL)",
  "fetched_at": "2025-10-03T12:34:56Z",
  "title": "Senior Full Stack Developer",
  "company": {
    "name": "TechCorp Inc.",
    "logo_url": "https://...",
    "website": "https://techcorp.com",
    "size": "100-500",
    "industry": "SaaS"
  },
  "location": {
    "city": "Austin",
    "state": "TX",
    "country": "US",
    "remote": "hybrid|onsite|remote",
    "days_onsite": 2
  },
  "description": "Full job description text...",
  "requirements": {
    "must_have": ["React", "Node.js", "5+ years experience"],
    "nice_to_have": ["TypeScript", "AWS"],
    "education": "Bachelor's degree or equivalent",
    "certifications": []
  },
  "responsibilities": [
    "Build scalable web applications",
    "Mentor junior developers"
  ],
  "salary": {
    "min": 120000,
    "max": 180000,
    "currency": "USD",
    "period": "annual",
    "disclosed": true
  },
  "benefits": ["Health insurance", "401k", "Remote work"],
  "employment_type": "full_time|part_time|contract|internship",
  "seniority": "senior|mid|junior|staff|principal",
  "posted_date": "2025-09-15",
  "expires_date": "2025-11-15",
  "apply_url": "https://...",
  "raw_data": {} // Original API response for debugging
}
```

**Mapping Functions (Examples):**

```javascript
// Adzuna API → Standard Format
function normalizeAdzuna(apiResponse) {
  return {
    job_id: `adzuna:${apiResponse.id}`,
    source: 'adzuna',
    source_url: apiResponse.redirect_url,
    title: apiResponse.title,
    company: {
      name: apiResponse.company.display_name,
      website: apiResponse.company.website || null
    },
    location: {
      city: apiResponse.location.area[2], // Most specific
      country: apiResponse.location.area[0],
      remote: detectRemote(apiResponse.description)
    },
    description: apiResponse.description,
    salary: apiResponse.salary_min && apiResponse.salary_max ? {
      min: apiResponse.salary_min,
      max: apiResponse.salary_max,
      currency: 'USD',
      period: 'annual',
      disclosed: true
    } : null,
    posted_date: apiResponse.created,
    employment_type: apiResponse.contract_type,
    raw_data: apiResponse
  };
}

// JSearch API → Standard Format
function normalizeJSearch(apiResponse) {
  return {
    job_id: `jsearch:${apiResponse.job_id}`,
    source: 'jsearch',
    source_url: apiResponse.job_apply_link,
    title: apiResponse.job_title,
    company: {
      name: apiResponse.employer_name,
      logo_url: apiResponse.employer_logo,
      website: apiResponse.employer_website
    },
    location: {
      city: apiResponse.job_city,
      state: apiResponse.job_state,
      country: apiResponse.job_country,
      remote: apiResponse.job_is_remote ? 'remote' : 'onsite'
    },
    description: apiResponse.job_description,
    salary: apiResponse.job_min_salary ? {
      min: apiResponse.job_min_salary,
      max: apiResponse.job_max_salary,
      currency: 'USD',
      period: 'annual',
      disclosed: true
    } : null,
    employment_type: apiResponse.job_employment_type,
    posted_date: apiResponse.job_posted_at_datetime_utc,
    apply_url: apiResponse.job_apply_link,
    raw_data: apiResponse
  };
}

// Greenhouse (scraped HTML) → Standard Format
function normalizeGreenhouse(scrapedData) {
  return {
    job_id: `greenhouse:${scrapedData.id}`,
    source: 'greenhouse',
    source_url: scrapedData.url,
    title: scrapedData.title,
    company: {
      name: extractFromUrl(scrapedData.url),
      logo_url: scrapedData.company_logo
    },
    location: parseLocation(scrapedData.location_text),
    description: scrapedData.content,
    // Parse requirements from description
    requirements: extractRequirements(scrapedData.content),
    posted_date: scrapedData.updated_at,
    apply_url: scrapedData.absolute_url,
    raw_data: scrapedData
  };
}
```

### 12.6 Fallback Strategy (Cascade)

**Priority Order:**

1. **Check Cache** (Redis) → If found & fresh (<24hr), return immediately
2. **Try Primary API** (based on source):
   - LinkedIn → JSearch API (aggregator)
   - Indeed → JSearch API
   - Greenhouse → Direct HTML parse
   - Unknown → JSearch API (searches across sources)
3. **Try Secondary API** (if primary fails):
   - Adzuna API (if US/UK/CA job)
   - Remotive API (if remote job detected)
4. **Try Scraping** (if APIs exhausted):
   - ScraperAPI with provided URL
   - Parse HTML directly
5. **Manual Fallback**:
   - Show error: "Unable to fetch job automatically. Please paste the job description below."
   - Offer text input box

**Code Example:**
```javascript
async function fetchJobData(jobUrl) {
  const { source, jobId, originalUrl } = parseJobUrl(jobUrl);
  
  // 1. Check cache
  const cached = await redis.get(`job:${source}:${jobId}`);
  if (cached && !isStale(cached, 24 * 60 * 60)) {
    return JSON.parse(cached);
  }
  
  // 2. Try primary API
  try {
    let jobData;
    switch (source) {
      case 'linkedin':
      case 'indeed':
        jobData = await jsearchApi.getJob(originalUrl);
        break;
      case 'greenhouse':
        jobData = await scrapeGreenhouse(originalUrl);
        break;
      case 'adzuna':
        jobData = await adzunaApi.getJob(jobId);
        break;
      // ... more cases
      default:
        jobData = await jsearchApi.search(originalUrl);
    }
    
    if (jobData) {
      // Normalize and cache
      const normalized = normalize(jobData, source);
      await redis.setex(`job:${source}:${jobId}`, 86400, JSON.stringify(normalized));
      return normalized;
    }
  } catch (error) {
    logger.warn(`Primary API failed for ${source}:${jobId}`, error);
  }
  
  // 3. Try secondary APIs
  try {
    const adzunaData = await adzunaApi.search(jobUrl);
    if (adzunaData) return normalize(adzunaData, 'adzuna');
  } catch (error) {
    logger.warn('Adzuna fallback failed', error);
  }
  
  // 4. Try scraping as last resort
  try {
    const scraped = await scraperApi.fetch(originalUrl);
    return parseHtmlJobPage(scraped);
  } catch (error) {
    logger.error('All job fetch attempts failed', error);
  }
  
  // 5. Give up, ask user for manual input
  throw new JobFetchError('Unable to fetch job automatically. Please paste job description manually.');
}
```

### 12.7 Rate Limiting & Cost Management

**API Usage Quotas (Free Tiers):**
- Adzuna: 1000/month
- JSearch: 250/month
- SerpApi: 100/month
- Remotive: Unlimited
- The Muse: 500/day

**Strategy to Stay Within Limits:**

**1. Aggressive Caching:**
```javascript
// Cache job data for 24 hours (jobs don't change that often)
// Even if user re-analyzes, use cached version
const CACHE_TTL = 24 * 60 * 60; // 24 hours

// For popular jobs (detected by multiple fetches), extend cache
if (fetchCount > 5) {
  CACHE_TTL = 7 * 24 * 60 * 60; // 7 days
}
```

**2. Smart API Selection:**
```javascript
// Use cheapest/free API first
const apiPriority = {
  remotive: 0,      // Free, unlimited
  themuse: 1,       // Free, 500/day
  adzuna: 2,        // Free, 1000/month
  jsearch: 3,       // Free, 250/month (save for tough cases)
  serpapi: 4        // Free, 100/month (last resort)
};
```

**3. User-based Rate Limiting:**
```javascript
// Anonymous users: Share global quota
// Free tier users: 3 job fetches/month (rest must paste)
// Paid users: Unlimited (we pay for overages)

async function checkApiQuota(user) {
  if (user.tier === 'free' || !user.loggedIn) {
    const used = await redis.get(`api_usage:${user.id}`);
    if (used >= 3) {
      throw new QuotaExceededError('API limit reached. Upgrade to Pro for unlimited job fetching.');
    }
  }
  // Paid users always allowed
  return true;
}
```

**4. Monitor & Alert:**
```javascript
// Daily quota monitoring
const quotaStatus = {
  adzuna: { used: 250, limit: 1000, percentage: 25 },
  jsearch: { used: 180, limit: 250, percentage: 72 }, // ⚠️ Getting close
  serpapi: { used: 45, limit: 100, percentage: 45 }
};

// Alert at 80% usage
if (quotaStatus.jsearch.percentage > 80) {
  alertSlack('JSearch API at 80% quota. Consider upgrading or using alternatives.');
}
```

**5. Graceful Degradation:**
```javascript
// If quota exceeded, don't fail - just ask user to paste
if (apiQuotaExceeded) {
  return {
    success: false,
    message: "We've reached our job API limit for today. Please paste the job description below.",
    fallback: true
  };
}
```

### 12.8 UI/UX for Job Fetching

**Input Options:**

```
┌────────────────────────────────────────────────┐
│  Job Description                               │
├────────────────────────────────────────────────┤
│                                                │
│  🔗 Paste Job URL (Recommended)                │
│  ┌──────────────────────────────────────────┐ │
│  │ https://linkedin.com/jobs/view/123456    │ │
│  └──────────────────────────────────────────┘ │
│  [Fetch Job] button                            │
│                                                │
│  Supported: LinkedIn, Indeed, Greenhouse,     │
│  Lever, Workable, Adzuna, Remotive, The Muse  │
│                                                │
│  ───────────── OR ─────────────                │
│                                                │
│  📄 Upload Job Description (PDF, DOCX, TXT)   │
│  [Drag & Drop Zone]                            │
│                                                │
│  ───────────── OR ─────────────                │
│                                                │
│  ✏️ Paste Job Description Text                │
│  ┌──────────────────────────────────────────┐ │
│  │ [Text editor with formatting]             │ │
│  │                                            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

**Loading States:**

```
Fetching job...
├─ Extracting job ID... ✓
├─ Checking cache... ✓
├─ Fetching from LinkedIn via JSearch API... ⏳
└─ Parsing job details...

Job fetched successfully! ✓
• Title: Senior Full Stack Developer
• Company: TechCorp Inc.
• Location: Austin, TX (Hybrid - 2 days/week)
• Posted: 5 days ago

[Proceed to Analysis]
```

**Error States:**

```
⚠️ Unable to fetch job automatically

Reason: API quota exceeded for today

Please paste the job description manually below:
[Text input box]

Or try again tomorrow (quota resets at midnight UTC)
```

### 12.9 Admin Dashboard for API Monitoring

**Metrics to Track:**

```
┌──────────────────────────────────────────────┐
│  Job API Health Dashboard                    │
├──────────────────────────────────────────────┤
│                                              │
│  Today's API Usage:                          │
│  ├─ Adzuna:    250/1000  ████████░░ 25%     │
│  ├─ JSearch:   180/250   ██████████ 72% ⚠️  │
│  ├─ SerpAPI:   45/100    ████░░░░░░ 45%     │
│  └─ Remotive:  120/∞     ✓ Unlimited        │
│                                              │
│  Success Rate (Last 24h):                    │
│  ├─ Primary API: 87% (1,234 / 1,420)        │
│  ├─ Fallback API: 9% (128 / 1,420)          │
│  └─ Manual paste: 4% (58 / 1,420)           │
│                                              │
│  Top Fetched Sources:                        │
│  1. LinkedIn: 45%                            │
│  2. Indeed: 28%                              │
│  3. Greenhouse: 12%                          │
│  4. Other: 15%                               │
│                                              │
│  Cost (Month-to-date):                       │
│  └─ API overages: $12.50 (JSearch paid tier) │
│                                              │
└──────────────────────────────────────────────┘
```

### 12.10 API Key Management

**Security Best Practices:**

```javascript
// Store API keys in environment variables (never in code)
const API_KEYS = {
  adzuna: {
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY
  },
  jsearch: {
    api_key: process.env.RAPID_API_KEY
  },
  serpapi: {
    api_key: process.env.SERP_API_KEY
  }
};

// Rotate keys quarterly (security)
// Use different keys for dev/staging/prod
// Monitor for unauthorized usage
```

**API Key Rotation Plan:**
- Q1: Generate new keys
- Q2: Deploy new keys, keep old as fallback
- Q3: Deprecate old keys
- Q4: Review usage, optimize costs

### 12.11 Future Enhancements (Job API)

**v1.1:**
- Add more job sources (Glassdoor, Monster, CareerBuilder)
- Company reviews integration (Glassdoor API)
- Salary data enrichment (Glassdoor, Levels.fyi)

**v1.2:**
- Real-time job alerts (webhook when saved job changes)
- Job comparison tool (compare 5 jobs side-by-side)
- Auto-apply feature (if user is qualified)

**v2.0:**
- AI job recommendations ("Jobs you might qualify for")
- Application status tracking (integrates with ATS)
- Interview scheduling (if job supports it)

---

## 13. Data Privacy & Security

### 13.1 Data Handling

**Transient Storage (Default for Anonymous Users):**
- Documents stored in-memory during analysis
- Automatic deletion after 1 hour or when session ends
- No logs of document content
- Generated cover letters not saved

**Persistent Storage (Opt-in for Registered Users):**
- Encrypted document storage (AES-256)
- User can delete any/all documents anytime
- Retention period: User-controlled (default 30 days)
- Export all data (GDPR compliance)

### 13.2 PII Protection

**Automatic Redaction (Optional):**
- Offer to redact phone, email, address from resume before analysis
- Preserve for user's own records but not sent to LLM

**Sharing/Export:**
- Default: Redact PII when sharing analysis link
- User toggle: Include/exclude PII in exports

### 13.3 Security Measures

**Input Sanitization:**
- Strip HTML/JavaScript from uploaded documents
- Validate file types (whitelist: PDF, DOCX, TXT, MD)
- Max file size: 5MB
- Virus scanning for uploads (ClamAV or cloud service)

**API Security:**
- Rate limiting: 10 requests/hour for anonymous, 100/hour for registered
- CORS: Whitelist only app domain
- HTTPS only
- JWT authentication for registered users
- API key rotation

**LLM Safety:**
- Content filtering on inputs (block harmful content)
- Output validation (check for PII leakage)
- Prompt injection detection

### 13.4 Compliance

**GDPR:**
- Clear consent for data processing
- Right to access (export data)
- Right to deletion (delete all button)
- Data portability (JSON export)

**CCPA:**
- Privacy policy disclosure
- Opt-out of data sale (not applicable - no data sold)
- Transparency in data usage

---

## 14. Performance & Scalability

### 14.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Document parsing | <2s | 95th percentile |
| Job API fetch | <3s | 95th percentile |
| Analysis (full 10 iterations) | <5s | 95th percentile |
| Cover letter generation | <8s | 95th percentile |
| API response time | <3s | p95 |
| Frontend initial load | <2s | Lighthouse score >90 |

### 14.2 Optimization Strategies

**Document Parsing:**
- Lazy loading: Parse on-demand, not on upload
- Caching: Cache parsed documents for re-analysis
- Parallel processing: Parse JD + Resume concurrently

**Job API Integration:**
- Aggressive caching: 24hr cache for fetched jobs
- Parallel API calls: Try multiple sources simultaneously
- Pre-fetch: If user hovers over "Fetch Job" button, start request early

**Scoring:**
- Batch LLM calls where possible
- Cache frequently-analyzed job descriptions
- Pre-compute skill synonym mappings

**LLM Usage:**
- Use smaller models for extraction (GPT-3.5, Claude Haiku)
- Use larger models only for generation (GPT-4, Claude Opus)
- Stream responses for cover letter (show progress)

### 14.3 Scalability

**Horizontal Scaling:**
- Stateless backend (can add instances)
- Load balancer (AWS ALB, Cloudflare)
- Async job processing (Bull, Celery) for slow operations

**Cost Management:**
- LLM request batching
- Caching at multiple levels (Redis, CDN)
- Rate limiting to prevent abuse
- Tiered pricing (free: 5 analyses/day, pro: unlimited)

---

## 15. Testing Strategy

### 15.1 Unit Tests

**Document Parser:**
- Test with various PDF formats (scanned, native)
- Test with DOCX (different Word versions)
- Test with malformed files
- Test with empty/minimal resumes

**Job API Integration:**
- Test URL parsing for all supported sources
- Test API response normalization
- Test fallback chain (primary → secondary → scraping)
- Test cache hit/miss scenarios
- Mock API responses for consistent testing

**Skill Matching:**
- Test exact matches
- Test synonyms (React.js vs ReactJS)
- Test related skills (React vs Vue)
- Test no-match cases

**Scoring:**
- Test each perspective independently
- Test weight normalization
- Test edge cases (0 years, 20+ years)
- Test score range (ensure 1-10)

### 15.2 Integration Tests

**Full Analysis Flow:**
- Upload JD + Resume → Get scored analysis
- Fetch job via URL → Parse → Analyze
- Trigger re-evaluation for score ≥8.0
- Generate cover letter
- Export PDF/Markdown

**API Endpoints:**
- Test all endpoints with valid/invalid inputs
- Test authentication/authorization
- Test rate limiting
- Test error handling

**Job API Integration:**
- Test with real API keys (staging environment)
- Test quota management
- Test cache expiration
- Test API failure scenarios

### 15.3 End-to-End Tests

**User Journeys:**
1. Anonymous user: Paste job URL → Auto-fetch → Analyze → Export
2. Anonymous user: Job fetch fails → Manually paste → Analyze
3. Registered user: Upload → Analyze → Save → Re-analyze later
4. User with preferences: Set preferences → Analyze → See warnings
5. High score user: Analyze → Generate cover letter → Export

### 15.4 Acceptance Tests

**AT-1: Job URL Fetching**
- Input: Valid LinkedIn job URL
- Expected: Job data auto-populated, analysis proceeds
- Result: Pass/Fail

**AT-2: Job API Fallback**
- Input: LinkedIn URL, but JSearch API down
- Expected: Falls back to Adzuna or scraping, succeeds
- Result: Pass/Fail

**AT-3: API Quota Exceeded**
- Input: 251st job fetch in a month (JSearch limit)
- Expected: Falls back gracefully, asks user to paste manually
- Result: Pass/Fail

**AT-4: Perfect Match Candidate**
- Input: Resume with ALL required skills + sufficient experience
- Expected: Score ≥9.0, "Excellent fit", no warnings
- Result: Pass/Fail

**AT-5: Partial Match Candidate**
- Input: Resume with 60% required skills, 3/5 years experience
- Expected: Score 6.5-7.5, "Moderate fit", skill gaps listed
- Result: Pass/Fail

**AT-6: Poor Match Candidate**
- Input: Resume with <30% skill overlap
- Expected: Score <6.0, "Weak fit", extensive gap list
- Result: Pass/Fail

**AT-7: User Preference Warning**
- Input: User sets "No CA", JD location = "San Francisco, CA"
- Expected: Warning displayed, analysis continues
- Result: Pass/Fail

**AT-8: No Fabrication in Cover Letter**
- Input: Resume lacks "Django", JD requires "Django"
- Expected: Generated letter does NOT mention Django
- Result: Pass/Fail

**AT-9: Export Functionality**
- Input: Completed analysis
- Expected: PDF export includes all sections, readable format
- Result: Pass/Fail

**AT-10: Cache Performance**
- Input: Fetch same job URL twice within 24 hours
- Expected: Second fetch <500ms (from cache)
- Result: Pass/Fail

---

## 16. Error Handling & Edge Cases

### 16.1 Document Parsing Failures

**Scenario:** PDF is corrupted/unreadable
**Handling:**
- Show error: "Unable to parse document. Please try a different format or paste text manually."
- Offer alternative: Text paste box
- Log error (without content) for debugging

**Scenario:** Resume is in a foreign language
**Handling:**
- Detect language (use language detection library)
- If non-English: "We currently support English resumes only. Consider translating."
- (v2: Add multi-language support)

### 16.2 Job API Failures

**Scenario:** All APIs return errors or quota exceeded
**Handling:**
- Show friendly message: "Unable to fetch job automatically. Please paste the job description below."
- Offer manual paste input
- Log which APIs failed (for debugging)
- Alert admins if multiple failures (possible API outage)

**Scenario:** Job URL is invalid or job no longer exists (404)
**Handling:**
- Show error: "This job posting appears to be removed or expired. Please check the URL or paste the job description manually."
- Suggest checking if job is still active on original site

**Scenario:** Job is behind login wall (authentication required)
**Handling:**
- Detect authentication requirement
- Show message: "This job requires login to view. Please copy the full job description and paste it below."
- Provide instructions on how to copy (screenshot included)

### 16.3 LLM API Failures

**Scenario:** API timeout or error
**Handling:**
- Fallback: Use rule-based scoring only (keyword matching, years calculation)
- Show banner: "Enhanced analysis unavailable. Showing basic analysis."
- Retry: Attempt 1 retry with exponential backoff
- Graceful degradation: Some features unavailable (e.g., cover letter generation)

### 16.4 Edge Cases

**Empty/Minimal Resume:**
- If resume <100 words: Warning "Resume seems very short. Results may be inaccurate."
- If no skills detected: Error "Unable to extract skills. Please ensure resume includes technical skills section."

**Very Long Documents:**
- If >10,000 words: Warning "Large document detected. Analysis may be slower."
- Truncate to token limit: Keep first + last sections, summarize middle

**Ambiguous Job Descriptions:**
- If JD lacks clear requirements: "This job description is vague. Scoring may be less accurate."
- Prompt user to add additional context

**Conflicting Information:**
- If JD says "5 years required" but also "entry-level": Flag as inconsistent
- Show both pieces of info, let user interpret

**Job URL from Unsupported Source:**
- If URL pattern not recognized: "This job board isn't directly supported. Attempting to fetch as generic URL..."
- Try scraping or ask for manual paste

**Rate Limit Hit Mid-Analysis:**
- If quota exceeded while processing multiple jobs: "API limit reached. Completed 3 of 5 analyses. Upgrade for unlimited, or try again tomorrow."

---

## 17. Deployment & Operations

### 17.1 Environments

**Development:**
- Local Docker Compose setup
- Mock LLM responses (faster testing)
- Mock Job API responses (avoid quota usage)
- In-memory storage only

**Staging:**
- Mirrors production (smaller scale)
- Real LLM API (separate key)
- Real Job APIs with test quotas
- S3 bucket for testing
- Test domain: staging.jobanalyzer.app

**Production:**
- Multi-region deployment (US-East, US-West, EU)
- Auto-scaling (min 2, max 10 instances)
- CDN for static assets
- Production LLM API key
- Production Job API keys (higher quotas)
- Domain: jobanalyzer.app

### 17.2 Monitoring

**Application Metrics:**
- Request rate, latency (p50, p95, p99)
- Error rate by endpoint
- LLM API usage and costs
- Job API usage and quota status
- User sign-ups, analysis count
- Conversion rate (analyze → generate cover letter)
- Job fetch success rate by source

**Infrastructure Metrics:**
- CPU, memory usage
- Disk I/O (for file storage)
- Network bandwidth
- Database connections
- Redis cache hit rate

**Alerting:**
- Error rate >5% for 5min → Page on-call
- Latency p95 >10s → Slack alert
- LLM API down → Immediate page
- Job API quota >80% → Email alert
- Cost anomaly (>$100/hour) → Email alert
- Job fetch failure rate >50% → Investigate API issues

### 17.3 Logging

**Structured Logging:**
```json
{
  "timestamp": "2025-10-03T12:34:56Z",
  "level": "info",
  "service": "analyzer",
  "endpoint": "/analyze",
  "analysis_id": "uuid",
  "duration_ms": 4523,
  "score": 8.2,
  "user_id": "uuid or 'anonymous'",
  "llm_tokens": 3421,
  "job_source": "linkedin",
  "job_fetch_method": "jsearch_api",
  "cache_hit": false,
  "error": null
}
```

**Log Retention:**
- Debug logs: 7 days
- Info logs: 30 days
- Error logs: 90 days
- No document content logged (only metadata)
- Job URLs logged (for debugging fetch issues)

### 17.4 CI/CD Pipeline

```
1. Code Push (GitHub)
   ↓
2. Automated Tests (GitHub Actions)
   ├─ Unit tests
   ├─ Integration tests (with mocked APIs)
   ├─ Linting
   └─ Security scan
   ↓
3. Build & Package (Docker)
   ↓
4. Deploy to Staging (Auto)
   ↓
5. Smoke Tests on Staging
   ├─ Test job fetch from each source
   ├─ Test analysis flow
   └─ Test API endpoints
   ↓
6. Manual Approval
   ↓
7. Deploy to Production (Blue-Green)
   ↓
8. Health Checks
   ├─ Verify all APIs accessible
   ├─ Check cache connectivity
   └─ Test sample analysis
   ↓
9. Monitor for 1 hour (Canary)
```

---

## 18. User Documentation

### 18.1 User Guide Sections

**Getting Started:**
- How to upload documents
- How to fetch jobs via URL (new)
- Understanding your score
- Reading gap analysis
- Setting preferences

**Best Practices:**
- Ensure resume is up-to-date
- Use detailed job descriptions (or fetch automatically)
- Review warnings carefully
- Verify generated cover letters

**FAQ:**
- "Why did I get a low score?"
- "How do I paste a job URL?" (new)
- "Why can't you fetch this job?" (new)
- "Are my documents stored?"
- "Can I edit the generated cover letter?"
- "What if the analysis seems wrong?"

**Troubleshooting:**
- "My PDF won't upload"
- "Job fetch failed" (new)
- "Analysis is taking too long"
- "I disagree with the score"

**Supported Job Sources:** (new)
- Complete list of job boards we support
- How to find job URLs from each source
- What to do if your job board isn't supported

### 18.2 Help Content (In-App)

**Tooltips:**
- Hover over score: "This is an average of 10 different evaluation perspectives"
- Hover over gap: "Suggestions to improve your fit for this role"
- Hover over "Fetch Job" button: "Paste a URL from LinkedIn, Indeed, or other supported job boards"

**Contextual Help:**
- "Upload Your Resume" section: Link to "What makes a good resume?"
- "Paste Job URL" section: Link to "Which job boards are supported?"
- "Preferences" section: "Learn how preferences affect analysis"

---

## 19. Subscription Model & Monetization

### 19.1 Pricing Strategy Philosophy

**Target Market:** Active job seekers who value data-driven career decisions  
**Price Positioning:** Premium value (saves time, increases interview rate)  
**Psychology:** Free tier shows value → converts to paid for serious job search

### 19.2 Subscription Tiers

#### **FREE TIER** (Freemium Gateway)
**Price:** $0/forever  
**Target:** Casual explorers, low-volume users  
**Limits:**
- 3 analyses per month (resets on 1st)
- 2 job URL fetches per month (rest must paste manually)
- Basic scoring (10 iterations + final average)
- Gap analysis (missing skills only)
- View results only (no save/export)
- Community support (FAQ, docs)

**Features Included:**
- ✅ Upload resume + JD
- ✅ Auto-fetch jobs (2 per month, then paste manually)
- ✅ 10-iteration scoring
- ✅ Final qualification score
- ✅ Missing skills list
- ✅ Basic keyword match
- ❌ No cover letter generation
- ❌ No PDF/Markdown export
- ❌ No save history
- ❌ No batch compare

**Conversion Strategy:**
- Banner after 3rd analysis: "Upgrade to continue analyzing"
- Show preview of Pro features (blurred)
- 7-day trial offer for first-time visitors

---

#### **STARTER TIER** ($9.99/month or $89/year)
**Price:** $9.99/mo or $89/yr (save $31/year = 26% discount)  
**Target:** Active job seekers (applying to 10-20 jobs/month)  
**Best For:** Individual contributors, recent grads, career transitioners

**Limits:**
- 50 analyses per month
- 50 job URL fetches per month
- 10 cover letter generations per month
- 100 MB storage

**Features:**
- ✅ Everything in Free
- ✅ **Cover letter generation** (AI-powered, no fabrication)
- ✅ **PDF & Markdown export**
- ✅ **Save up to 20 analyses** (dashboard access)
- ✅ **Enhanced gap analysis** (with learning resources)
- ✅ **Batch compare** (1 resume vs 3 jobs side-by-side)
- ✅ **Email support** (48-hour response)
- ✅ **Browser extension** (analyze from LinkedIn/Indeed)

**Value Proposition:**
- Save 10+ hours per job search
- Apply with confidence to right-fit roles
- Professional cover letters in seconds

---

#### **PRO TIER** ($24.99/month or $199/year) 🔥 MOST POPULAR
**Price:** $24.99/mo or $199/yr (save $100/year = 33% discount)  
**Target:** Serious job seekers, senior professionals, frequent job changers  
**Best For:** Anyone in active job search mode (3-6 month campaigns)

**Limits:**
- **Unlimited analyses**
- **Unlimited job URL fetches**
- **Unlimited cover letter generations**
- 1 GB storage

**Features:**
- ✅ Everything in Starter
- ✅ **Unlimited analyses & cover letters**
- ✅ **Save unlimited analyses** (organized by job, company, date)
- ✅ **Advanced batch compare** (1 resume vs 10 jobs)
- ✅ **Resume optimizer** (AI suggestions to improve your resume)
- ✅ **Interview prep insights** (predict interview questions based on JD)
- ✅ **Salary insights** (estimated range based on role/location)
- ✅ **Application tracking** (track applied, interviewing, rejected, offers)
- ✅ **Skills gap roadmap** (personalized learning path)
- ✅ **Priority email support** (24-hour response)
- ✅ **Resume templates** (ATS-friendly, modern designs)
- ✅ **Version history** (track resume changes over time)

**Exclusive Features:**
- 📊 **Analytics dashboard** (see your job search trends)
- 🎯 **Smart job recommendations** (AI suggests roles based on your profile)
- 📧 **Weekly digest** (summary of analyses, trends, tips)
- 🔔 **Alerts** (notify when saved jobs update or expire)

**Value Proposition:**
- Land a job 50% faster (based on user surveys)
- Increase interview rate by 40%
- All-in-one job search command center

---

#### **CAREER TIER** ($49.99/month or $399/year) 💼 POWER USERS
**Price:** $49.99/mo or $399/yr (save $200/year = 33% discount)  
**Target:** Executives, senior leaders, career coaches  
**Best For:** High-stakes job searches, consulting multiple clients

**Limits:**
- **Unlimited everything**
- 10 GB storage
- Up to 5 resume profiles (manage multiple roles/personas)

**Features:**
- ✅ Everything in Pro
- ✅ **Multiple resume profiles** (e.g., "Software Engineer Resume" vs "Manager Resume")
- ✅ **Career coaching AI chat** (ask career questions, get personalized advice)
- ✅ **Network insights** (LinkedIn connection analysis - who can refer you)
- ✅ **Offer negotiation guidance** (AI-powered salary negotiation scripts)
- ✅ **Executive resume review** (human expert review - 1x per month)
- ✅ **Priority phone/video support** (scheduled calls)
- ✅ **Custom branding** (white-label exports for consultants)
- ✅ **API access** (integrate with your tools - 1000 calls/month)
- ✅ **Early access** (beta features, new tools)

**Exclusive Features:**
- 🤝 **Referral network mapping** (find mutual connections at target companies)
- 📞 **Live coaching session** (30 min/month with career expert)
- 🎓 **Masterclass library** (video courses on interviewing, negotiation, etc.)
- 📈 **Career trajectory analysis** (predict future role progression)

**Value Proposition:**
- Executive-level career management
- Land $20K+ higher offers through negotiation
- Perfect for consultants managing multiple client resumes

---

### 17.3 Add-Ons (À La Carte)

For users who want specific features without full tier upgrade:

**Resume Professional Review** - $29 one-time
- Human expert reviews your resume
- Detailed feedback document
- 1 round of revisions
- 3-day turnaround

**Cover Letter Package (10 credits)** - $14.99
- Generate 10 cover letters
- No monthly subscription needed
- Credits never expire
- Perfect for low-volume users

**Priority Analysis (1 credit)** - $4.99
- Skip the queue (instant results)
- Enhanced accuracy (use GPT-4 instead of 3.5)
- Great for urgent applications

**Extended Storage (10 GB)** - $4.99/month
- Add-on to any tier
- For users with extensive job search history

**API Access (Pro)** - $19.99/month
- 5,000 API calls/month
- Access to all endpoints
- For developers, researchers

---

### 17.4 Special Offers & Promotions

**Student Discount** - 50% off any tier
- Verify with .edu email or student ID
- Valid for 4 years
- Helps recent grads in first job search

**Career Transition Support** - 3 months Pro for $49
- For laid-off workers (honor system)
- Show we care during tough times
- Builds brand loyalty

**Referral Program** - Give 1 month, Get 1 month
- Refer a friend → both get 1 month free
- Unlimited referrals
- Applies to Starter tier or higher

**Annual Commitment Discount** - Save up to 33%
- Starter: Save $31/year (26% off)
- Pro: Save $100/year (33% off)
- Career: Save $200/year (33% off)

**Seasonal Promotions:**
- **New Year Career Boost** (January): 40% off first 3 months
- **Spring Hiring Season** (March-May): Free trial extended to 14 days
- **Black Friday** (November): 50% off annual plans
- **Back to School** (August): Student discount + free resume template bundle

---

### 17.5 Free Trial Strategy

**7-Day Free Trial (No Credit Card Required)**
- Available for Starter, Pro, or Career tier
- Full access to all tier features
- No automatic charge (must manually upgrade)
- Email reminders on Day 3, Day 6, and after expiration

**Trial Conversion Tactics:**
- In-app tips showing how to maximize value
- Success stories from other users
- Limited-time upgrade offer (20% off if upgrade during trial)

**Grace Period:**
- If trial expires, keep read-only access to analyses created during trial
- Encourage upgrade to continue

---

### 17.6 Payment & Billing

**Accepted Methods:**
- Credit/debit cards (Visa, Mastercard, Amex, Discover)
- PayPal
- Apple Pay / Google Pay
- ACH bank transfer (annual plans only)
- Crypto (Bitcoin, Ethereum) - for international users

**Billing Cycle:**
- Monthly: Billed on sign-up date each month
- Annual: Single upfront payment, auto-renews yearly
- Grace period: 7 days after failed payment before downgrade

**Refund Policy:**
- 30-day money-back guarantee (no questions asked)
- Pro-rated refunds for annual plans (if downgrade mid-year)
- No refunds on add-ons after use

**Tax:**
- Prices exclusive of tax (added at checkout based on location)
- VAT for EU customers
- GST for Australian/Indian customers

---

### 17.7 Account Management

**Upgrades:**
- Instant access to new tier features
- Pro-rated credit for unused time on lower tier
- One-click upgrade from dashboard

**Downgrades:**
- Takes effect at next billing cycle (keep current tier until then)
- Data preserved (but access limited to new tier limits)
- Can re-upgrade anytime

**Cancellations:**
- Cancel anytime (no lock-in)
- Access remains until end of billing period
- Data preserved for 90 days (read-only)
- Reactivation offer sent at 30, 60, 90 days

**Pausing Subscription (Pro/Career only):**
- Pause for 1-3 months (e.g., between jobs)
- Data preserved
- $4.99/month pause fee (to cover storage)
- Resume anytime

---

### 19.8 Feature Comparison Table

| Feature | Free | Starter | Pro | Career |
|---------|------|---------|-----|--------|
| **Analyses per month** | 3 | 50 | ∞ | ∞ |
| **Job URL fetches** | 2 | 50 | ∞ | ∞ |
| **Cover letters** | ❌ | 10/mo | ∞ | ∞ |
| **Save analyses** | ❌ | 20 | ∞ | ∞ |
| **Export (PDF/MD)** | ❌ | ✅ | ✅ | ✅ |
| **Batch compare** | ❌ | 3 jobs | 10 jobs | ∞ jobs |
| **Gap analysis** | Basic | Enhanced | Enhanced | Enhanced |
| **Resume optimizer** | ❌ | ❌ | ✅ | ✅ |
| **Interview prep** | ❌ | ❌ | ✅ | ✅ |
| **Salary insights** | ❌ | ❌ | ✅ | ✅ |
| **Application tracker** | ❌ | ❌ | ✅ | ✅ |
| **Analytics dashboard** | ❌ | ❌ | ✅ | ✅ |
| **Resume profiles** | 1 | 1 | 1 | 5 |
| **Storage** | 0 | 100 MB | 1 GB | 10 GB |
| **Browser extension** | ❌ | ✅ | ✅ | ✅ |
| **Email support** | ❌ | 48hr | 24hr | Priority |
| **Expert resume review** | ❌ | ❌ | ❌ | 1/mo |
| **API access** | ❌ | ❌ | ❌ | ✅ |
| **Coaching session** | ❌ | ❌ | ❌ | 30min/mo |

---

### 17.9 Revenue Projections

**Assumptions (Year 1):**
- 50,000 total users
- 3% free → paid conversion
- Tier distribution: 40% Starter, 50% Pro, 10% Career
- 60% monthly, 40% annual

**Monthly Recurring Revenue (MRR) Calculation:**
```
Free users: 48,500 (paying $0)
Paid users: 1,500
  - Starter (40%): 600 × $9.99 = $5,994
  - Pro (50%): 750 × $24.99 = $18,743
  - Career (10%): 150 × $49.99 = $7,499

Total MRR: $32,236
Annual Run Rate (ARR): $386,832
```

**Year 1 Projections:**
| Month | Total Users | Paid Users | MRR | ARR |
|-------|-------------|------------|-----|-----|
| M1 | 1,000 | 30 | $647 | $7,764 |
| M3 | 5,000 | 150 | $3,235 | $38,820 |
| M6 | 15,000 | 450 | $9,706 | $116,472 |
| M12 | 50,000 | 1,500 | $32,236 | $386,832 |

**Churn Assumptions:**
- Starter: 15% monthly churn (job search ends)
- Pro: 10% monthly churn
- Career: 5% monthly churn (sticky for consultants)

---

### 17.10 Implementation Requirements

**Payment Gateway:**
- Stripe (recommended) - handles cards, Apple Pay, Google Pay
- Paddle (alternative) - handles tax, EU VAT automatically
- Chargebee (subscription management) - advanced billing logic

**Features to Build:**

**Billing Dashboard:**
- Current plan and usage
- Upgrade/downgrade buttons
- Payment method management
- Invoice history
- Cancel/pause subscription

**Usage Tracking:**
- Analyses used this month
- Cover letters generated
- Storage used
- API calls (if applicable)
- Progress bars showing limits

**Entitlement System:**
```python
def can_analyze(user):
    if user.tier == 'free':
        return user.analyses_this_month < 3
    elif user.tier == 'starter':
        return user.analyses_this_month < 50
    else:  # pro, career
        return True

def can_generate_cover_letter(user):
    if user.tier == 'free':
        return False
    elif user.tier == 'starter':
        return user.cover_letters_this_month < 10
    else:
        return True
```

**Subscription Events:**
- `subscription.created` → Send welcome email, enable features
- `subscription.renewed` → Reset monthly limits
- `subscription.canceled` → Downgrade at period end, send win-back email
- `payment.failed` → Retry 3 times, then downgrade

**Dunning (Failed Payment Recovery):**
- Day 1: Retry charge, email reminder
- Day 3: Retry charge, urgent email
- Day 5: Retry charge, final warning
- Day 7: Downgrade to free, send win-back offer

---

### 17.11 Marketing & Growth Strategy

**Acquisition Channels:**
- **SEO**: Target keywords like "job application analyzer", "resume scorer", "career fit assessment"
- **Content Marketing**: Blog posts on "How to know if you're qualified", "Job search mistakes"
- **Reddit**: r/jobs, r/resumes, r/careerguidance (authentic engagement, not spam)
- **LinkedIn**: Thought leadership posts, success stories
- **Product Hunt**: Launch with special offer
- **Partnerships**: Career coaches, bootcamps, universities

**Conversion Optimization:**
- A/B test pricing ($9.99 vs $12.99 for Starter)
- Test trial duration (7 days vs 14 days)
- Test trial card requirement (card vs no card)
- Optimize upgrade prompts (timing, copy, design)

**Retention Tactics:**
- Weekly value emails (tips, success stories)
- In-app achievement system (gamification)
- Community forum (connect job seekers)
- Success metrics (show "You saved X hours this month")

**Referral Incentives:**
- "Refer 3 friends, get 3 months free"
- Leaderboard for top referrers
- Swag for power users (t-shirts, stickers)

---

### 17.12 Competitive Pricing Analysis

**Competitor Comparison:**
| Service | Price | What They Offer |
|---------|-------|-----------------|
| **Jobscan** | $49.95/mo | Resume ATS optimization only |
| **VMock** | $20/mo | Resume review, no JD comparison |
| **Resume Worded** | $19/mo | Resume improvement, basic scoring |
| **Our Service** | $24.99/mo | Full analysis, cover letters, tracking |

**Our Advantage:**
- More comprehensive (resume + JD + cover letter)
- Better value (more features at competitive price)
- Unique 10-iteration scoring (no competitor does this)
- Focus on qualification fit, not just resume formatting

---

### 17.13 Subscription Success Metrics

**Key Metrics to Track:**
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Run Rate
- **CAC**: Customer Acquisition Cost (target: <$30)
- **LTV**: Lifetime Value (target: >$100)
- **LTV:CAC Ratio**: Target 3:1 or better
- **Churn Rate**: Target <10% monthly for Pro tier
- **Conversion Rate**: Free to Paid (target: 3-5%)
- **Upgrade Rate**: Starter → Pro (target: 20%)
- **ARPU**: Average Revenue Per User (target: $18)
- **NPS**: Net Promoter Score (target: >50)

**Dashboard for Monitoring:**
```
┌─────────────────────────────────────┐
│  Subscription Health Dashboard      │
├─────────────────────────────────────┤
│  MRR: $32,236 (+12% MoM) ✅         │
│  Active Subs: 1,500 (+150 net)      │
│  Churn: 8.5% (down from 10%) ✅     │
│  Trial → Paid: 4.2% ✅              │
│  LTV:CAC: 3.8:1 ✅                  │
│  ARPU: $21.49                        │
└─────────────────────────────────────┘
```

---

### 17.14 Legal & Compliance

**Terms of Service Updates:**
- Clear subscription terms (auto-renewal, cancellation)
- Refund policy disclosure
- Fair usage policy (prevent abuse)
- Data retention on cancellation

**Privacy for Paid Users:**
- Enhanced data security (encryption at rest)
- SOC 2 compliance (for Career tier)
- GDPR/CCPA full compliance
- Right to data export/deletion

**Subscription Laws:**
- FTC compliance (clear pricing, easy cancellation)
- EU consumer protection (14-day cooling off period)
- Automatic renewal disclosure
- Price change notification (30 days advance)

---

This comprehensive subscription model balances accessibility (free tier), value for active users (Starter/Pro), and premium features for power users (Career). The pricing is competitive, the value proposition is clear, and the implementation is detailed for your development team.

---

## 20. Roadmap (Future Versions)

### v1.0 (Launch - MVP)
- ✅ Core analysis (10 iterations)
- ✅ Job URL fetching (LinkedIn, Indeed, Greenhouse, Lever, etc.)
- ✅ Gap analysis
- ✅ Cover letter generation
- ✅ PDF export
- ✅ User preferences
- ✅ Free tier + Pro subscription

### v1.1 (Q2 2026)
- Multi-language support (Spanish, French)
- Additional job sources (Glassdoor, Monster)
- Improved skill synonym database
- Browser extension (analyze from LinkedIn)
- Learning resource recommendations
- Company reviews integration (Glassdoor API)

### v1.2 (Q3 2026)
- User accounts and dashboards
- Save & compare multiple analyses
- Skill growth tracking over time
- Email alerts for saved job matches
- Real-time job alerts (webhook when job changes)

### v2.0 (Q4 2026)
- Batch processing (1 resume vs multiple jobs)
- Hiring manager mode (invert analysis)
- ATS integration (Greenhouse, Lever)
- Mobile app (iOS, Android)
- Salary data enrichment (Levels.fyi, Glassdoor)

### v3.0 (2027)
- Interview prep recommendations
- Salary negotiation insights
- Career path suggestions
- AI mock interviews
- Application status tracking
- Auto-apply feature

---

## 21. Success Metrics (KPIs)

**User Engagement:**
- Daily Active Users (DAU)
- Analyses per user
- Job fetches per user (new metric)
- Cover letter generation rate
- Return rate (users who come back)

**Quality:**
- User satisfaction (post-analysis survey)
- Score accuracy (user feedback: "Was this accurate?")
- Cover letter usage (did they actually use it?)
- Job fetch success rate (by source)

**Growth:**
- Sign-up rate
- Conversion (free → pro)
- Referral rate
- App Store ratings (if mobile)

**Performance:**
- Analysis completion rate
- Job fetch latency (by source)
- Error rate
- Average latency
- LLM cost per analysis
- Job API cost per fetch

**Target (6 months post-launch):**
- 10,000 registered users
- 50,000 analyses/month
- 30,000 job fetches/month (60% adoption of URL feature)
- 4.5+ star rating
- <$0.50 LLM cost per analysis
- <$0.10 Job API cost per fetch
- 15% free-to-pro conversion
- 85% job fetch success rate

---

## Appendix A: Skill Taxonomy (Partial)

```json
{
  "programming_languages": {
    "JavaScript": {
      "synonyms": ["JS", "ECMAScript"],
      "related": ["TypeScript", "Node.js"],
      "family": ["Frontend", "Backend"]
    },
    "Python": {
      "synonyms": ["Python3", "Py"],
      "related": ["R", "Julia"],
      "family": ["Data Science", "Backend", "ML"]
    }
  },
  "frameworks": {
    "React": {
      "synonyms": ["React.js", "ReactJS"],
      "related": ["Vue", "Angular", "Svelte"],
      "family": ["Frontend", "SPA"]
    },
    "Django": {
      "synonyms": ["Django REST"],
      "related": ["Flask", "FastAPI"],
      "family": ["Backend", "Python"]
    }
  }
}
```

---

## Appendix B: Example Prompt for LLM Integration

### Job Description Extraction Prompt

```
You are an expert job description parser. Extract structured information from the provided JD text.

Input:
<job_description>
{{JD_TEXT}}
</job_description>

Output JSON schema:
{
  "title": "string",
  "company": "string",
  "location": {
    "city": "string",
    "state": "string",
    "country": "string",
    "remote": "onsite|hybrid|remote",
    "days_onsite": number
  },
  "requirements": {
    "must_have_skills": ["string"],
    "nice_to_have_skills": ["string"],
    "years_required": {"min": number, "max": number},
    "education": "string",
    "certifications": ["string"]
  },
  "responsibilities": ["string"],
  "tech_stack": {
    "primary": ["string"],
    "secondary": ["string"]
  },
  "role_type": "frontend|backend|fullstack|data|ml|devops|qa|pm|design|other",
  "seniority": "intern|junior|mid|senior|staff|principal|architect",
  "management_required": boolean
}

Rules:
- Be conservative: if info not stated, use null/empty array
- Infer seniority from title (e.g., "Senior" → "senior")
- Extract years as numbers (e.g., "5+ years" → {"min": 5})
- Categorize skills into must_have vs nice_to_have based on language ("required", "must", "essential" vs "preferred", "nice to have", "bonus")

Return valid JSON only, no explanation.
```

---

## Appendix C: Acceptance Criteria Checklist

Use this checklist during QA before launch:

- [ ] User can upload PDF/DOCX resume
- [ ] User can paste or upload job description
- [ ] Documents are parsed correctly (text extracted)
- [ ] Analysis completes in <10 seconds for typical docs
- [ ] 10 iteration scores are displayed
- [ ] Final average score is accurate (arithmetic mean)
- [ ] Re-evaluation triggers for scores ≥8.0
- [ ] Gap analysis shows missing required skills
- [ ] Gap analysis shows experience gaps
- [ ] Keyword match visualization is accurate
- [ ] User preferences can be set (optional)
- [ ] Warnings display based on preferences
- [ ] Score <6.0 shows "weak fit" message
- [ ] Score 8.0+ enables "Generate Cover Letter" button
- [ ] Cover letter generation completes in <15 seconds
- [ ] Generated letter includes only verified skills (no fabrication)
- [ ] Generated letter uses current date
- [ ] PDF export works and is readable
- [ ] Markdown export works
- [ ] User can delete their session/documents
- [ ] Site is keyboard-navigable
- [ ] Site works on mobile (responsive)
- [ ] Site loads in <3 seconds (Lighthouse score >80)
- [ ] Error messages are user-friendly
- [ ] LLM failure falls back gracefully
- [ ] Malicious file uploads are rejected
- [ ] Rate limiting prevents abuse
- [ ] Privacy policy is clear and accessible

---

**This completes the Program Requirements Prompt v2.0.**  
Use this document as the system prompt for AI code generation or as a comprehensive spec for development teams.
