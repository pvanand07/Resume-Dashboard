import { Candidate, WorkExperience, Project } from '../types';

// Calculate term frequency (TF)
export const calculateTF = (term: string, document: string[]): number => {
  const count = document.filter(word => word.toLowerCase() === term.toLowerCase()).length;
  return count / document.length;
};

// Calculate inverse document frequency (IDF)
export const calculateIDF = (term: string, documents: string[][]): number => {
  const numDocumentsWithTerm = documents.filter(
    doc => doc.some(word => word.toLowerCase() === term.toLowerCase())
  ).length;
  
  // Add smoothing to handle terms that don't appear in any document
  return Math.log((documents.length + 1) / (numDocumentsWithTerm + 1)) + 1;
};

// Calculate TF-IDF score for a term in a document
export const calculateTFIDF = (term: string, document: string[], documents: string[][]): number => {
  const tf = calculateTF(term, document);
  const idf = calculateIDF(term, documents);
  return tf * idf;
};

// Extract all skills from all candidates to create a unique skill vocabulary
export const extractSkillVocabulary = (candidates: Candidate[]): string[] => {
  const skillSet = new Set<string>();
  
  candidates.forEach(candidate => {
    // Add skills from work experiences
    candidate.work_experience.forEach(exp => {
      exp.skills.forEach(skill => skillSet.add(skill.toLowerCase()));
    });
    
    // Add skills from projects
    candidate.projects.forEach(project => {
      project.skills.forEach(skill => skillSet.add(skill.toLowerCase()));
    });
  });
  
  return Array.from(skillSet);
};

// Create document representations for each candidate
export const createCandidateDocuments = (candidates: Candidate[]): string[][] => {
  return candidates.map(candidate => {
    const document: string[] = [];
    
    // Add skills from work experiences
    if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
      candidate.work_experience.forEach(exp => {
        if (exp.skills && Array.isArray(exp.skills)) {
          exp.skills.forEach(skill => document.push(skill.toLowerCase()));
        }
        
        // Add job title words
        if (exp.title) {
          document.push(...exp.title.toLowerCase().split(/\s+/));
        }
        
        // Add company name
        if (exp.company) {
          document.push(...exp.company.toLowerCase().split(/\s+/));
        }
        
        // Add responsibilities as words
        if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
          exp.responsibilities.forEach(resp => {
            if (resp) {
              document.push(...resp.toLowerCase().split(/\s+/).filter(word => word.length > 3));
            }
          });
        }
      });
    }
    
    // Add skills from projects
    if (candidate.projects && Array.isArray(candidate.projects)) {
      candidate.projects.forEach(project => {
        if (project.skills && Array.isArray(project.skills)) {
          project.skills.forEach(skill => document.push(skill.toLowerCase()));
        }
        
        // Add project name
        if (project.name) {
          document.push(...project.name.toLowerCase().split(/\s+/));
        }
        
        // Add project description
        if (project.description) {
          document.push(...project.description.toLowerCase().split(/\s+/).filter(word => word.length > 3));
        }
      });
    }
    
    return document;
  });
};

// Calculate skill relevance scores for each candidate based on TF-IDF
export const calculateSkillRelevanceScores = (
  candidates: Candidate[], 
  relevantSkills: string[]
): Record<string, number> => {
  const candidateDocuments = createCandidateDocuments(candidates);
  const candidateScores: Record<string, number> = {};
  
  candidates.forEach((candidate, index) => {
    const document = candidateDocuments[index];
    let totalScore = 0;
    
    relevantSkills.forEach(skill => {
      totalScore += calculateTFIDF(skill, document, candidateDocuments);
    });
    
    // Normalize score to 0-1 range
    candidateScores[candidate.id] = totalScore / relevantSkills.length;
  });
  
  return candidateScores;
};

// Process text to extract keyword tokens
export const processText = (text: string): string[] => {
  // Remove special characters and convert to lowercase
  const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Split into words
  const words = cleanedText.split(/\s+/).filter(word => word.length > 2);
  
  // Filter out common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'was', 'that', 'this', 'are', 'have', 'from',
    'not', 'has', 'were', 'they', 'their', 'been', 'who', 'what', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'more', 'most', 'some', 'such'
  ]);
  
  return words.filter(word => !stopWords.has(word));
};

// Process job requirement text to extract key skills and requirements
export const processJobRequirement = (jobRequirement: string): string[] => {
  if (!jobRequirement) return [];
  
  // Process the job requirement text
  const processedWords = processText(jobRequirement);
  
  // Extract potential skill keywords (consider words that might be skills)
  // This is a simple approach - more sophisticated NLP could be used here
  return processedWords.filter(word => word.length > 3);
};

// Calculate similarity score between candidate and job requirements
export const calculateJobRequirementMatchScore = (
  candidate: Candidate,
  jobRequirement: string
): number => {
  if (!jobRequirement) return 0;
  
  // Extract key terms from job requirements
  const jobRequirementTerms = processJobRequirement(jobRequirement);
  
  // Create candidate document (collection of all skills, titles, descriptions)
  const candidateDocument: string[] = [];
  
  // Add skills from work experiences
  if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
    candidate.work_experience.forEach(exp => {
      if (exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach(skill => candidateDocument.push(skill.toLowerCase()));
      }
      if (exp.title) {
        candidateDocument.push(...exp.title.toLowerCase().split(/\s+/));
      }
      if (exp.company) {
        candidateDocument.push(...exp.company.toLowerCase().split(/\s+/));
      }
    });
  }
  
  // Add skills from projects
  if (candidate.projects && Array.isArray(candidate.projects)) {
    candidate.projects.forEach(project => {
      if (project.skills && Array.isArray(project.skills)) {
        project.skills.forEach(skill => candidateDocument.push(skill.toLowerCase()));
      }
      if (project.name) {
        candidateDocument.push(...project.name.toLowerCase().split(/\s+/));
      }
      if (project.description) {
        candidateDocument.push(...project.description.toLowerCase().split(/\s+/).filter(word => word.length > 3));
      }
    });
  }
  
  // Create all documents for TF-IDF calculation
  const allCandidates = [candidate]; // For this case, we just need this candidate's document
  const allDocuments = createCandidateDocuments(allCandidates);
  
  // Calculate TF-IDF scores for job requirement terms in candidate document
  let matchScore = 0;
  
  jobRequirementTerms.forEach(term => {
    // Check for exact skill matches first (weighted higher)
    const candidateSkills = [
      ...(candidate.work_experience || []).flatMap(exp => exp.skills || []), 
      ...(candidate.projects || []).flatMap(proj => proj.skills || [])
    ];
    
    const exactSkillMatch = candidateSkills
      .some(skill => skill && skill.toLowerCase().includes(term));
    
    if (exactSkillMatch) {
      matchScore += 1.5; // Higher weight for exact skill matches
    } else {
      // Check for partial matches in the document using TF-IDF
      matchScore += calculateTFIDF(term, candidateDocument, allDocuments) * 0.5;
    }
  });
  
  // Normalize the score (0-1 range)
  return Math.min(matchScore / (jobRequirementTerms.length * 1.5), 1);
};

// Calculate weighted candidate score based on skills, experience, and projects
export const calculateTotalCandidateScore = (
  candidate: Candidate,
  jobRequirement: string
): number => {
  // Skill match score (0-40 points)
  const skillMatchScore = calculateJobRequirementMatchScore(candidate, jobRequirement) * 40;
  
  // Experience score (0-30 points) - more weight for relevant experience
  const expScore = Math.min((candidate.total_we_months || 0) * 0.5, 30);
  
  // Projects score (0-30 points) - projects are highly valuable for assessment
  const projectsCount = candidate.projects && Array.isArray(candidate.projects) ? candidate.projects.length : 0;
  const projectScore = Math.min(projectsCount * 7.5, 30);
  
  // Total score (normalized to 0-100)
  return Math.round(skillMatchScore + expScore + projectScore);
}; 