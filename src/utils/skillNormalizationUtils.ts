import { Candidate } from '../types';

// Convert text to lowercase, remove punctuation and standardize spacing
const preprocessText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Standardize spaces
    .trim();
};

// Calculate Levenshtein distance between two strings
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

// Calculate Jaccard similarity between two strings
const jaccardSimilarity = (a: string, b: string): number => {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  
  if (setA.size === 0 && setB.size === 0) return 1.0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
};

// Calculate cosine similarity using term frequency vectors
const cosineSimilarity = (a: string, b: string): number => {
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  
  const uniqueWords = [...new Set([...wordsA, ...wordsB])];
  
  // Create term frequency vectors
  const vectorA = uniqueWords.map(word => wordsA.filter(w => w === word).length);
  const vectorB = uniqueWords.map(word => wordsB.filter(w => w === word).length);
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < uniqueWords.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
};

// Get similarity score using multiple metrics (weighted average)
export const getSkillSimilarityScore = (skill1: string, skill2: string): number => {
  const processed1 = preprocessText(skill1);
  const processed2 = preprocessText(skill2);
  
  // If preprocessed texts are identical, they're a perfect match
  if (processed1 === processed2) return 1.0;
  
  // If one string contains the other entirely, they're likely the same skill
  if (processed1.includes(processed2) || processed2.includes(processed1)) {
    return 0.9;
  }
  
  // Calculate different similarity metrics
  const levenshtein = 1 - levenshteinDistance(processed1, processed2) / Math.max(processed1.length, processed2.length);
  const jaccard = jaccardSimilarity(processed1, processed2);
  const cosine = cosineSimilarity(processed1, processed2);
  
  // Weighted average of similarity metrics
  return 0.4 * levenshtein + 0.3 * jaccard + 0.3 * cosine;
};

// Group similar skills using threshold-based clustering
export const groupSimilarSkills = (skills: string[], similarityThreshold: number = 0.8): Map<string, string[]> => {
  const groups = new Map<string, string[]>();
  const processedSkills = skills.map(skill => preprocessText(skill));
  
  for (let i = 0; i < skills.length; i++) {
    let foundGroup = false;
    
    // Check if this skill belongs to an existing group
    for (const [representative, groupMembers] of groups.entries()) {
      if (getSkillSimilarityScore(processedSkills[i], preprocessText(representative)) >= similarityThreshold) {
        groupMembers.push(skills[i]);
        foundGroup = true;
        break;
      }
    }
    
    // If no suitable group found, create a new one
    if (!foundGroup) {
      groups.set(skills[i], [skills[i]]);
    }
  }
  
  return groups;
};

// Choose a representative skill for each group
export const getRepresentativeSkills = (skillGroups: Map<string, string[]>): Map<string, string> => {
  const representativeMapping = new Map<string, string>();
  
  for (const [representative, groupMembers] of skillGroups.entries()) {
    // Choose the shortest skill as representative if it's not too short
    // Or the most frequent one in the future, when we have frequency data
    const sorted = [...groupMembers].sort((a, b) => {
      // Prefer skills with 3+ characters that aren't just abbreviations
      const aIsAbbrev = a.length < 4 && a === a.toUpperCase();
      const bIsAbbrev = b.length < 4 && b === b.toUpperCase();
      
      if (aIsAbbrev && !bIsAbbrev) return 1;
      if (!aIsAbbrev && bIsAbbrev) return -1;
      
      // Otherwise prefer the shorter of the two
      return a.length - b.length;
    });
    
    const bestRepresentative = sorted[0];
    
    // Map all skills in this group to the representative skill
    for (const skill of groupMembers) {
      representativeMapping.set(skill, bestRepresentative);
    }
  }
  
  return representativeMapping;
};

// Extract all unique skills from candidates
export const extractAllSkills = (candidates: Candidate[]): string[] => {
  const skillsSet = new Set<string>();
  
  if (candidates && Array.isArray(candidates)) {
    candidates.forEach(candidate => {
      if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
        candidate.work_experience.forEach(exp => {
          if (exp.skills && Array.isArray(exp.skills)) {
            exp.skills.forEach(skill => {
              if (skill) skillsSet.add(skill);
            });
          }
        });
      }
      
      if (candidate.projects && Array.isArray(candidate.projects)) {
        candidate.projects.forEach(project => {
          if (project.skills && Array.isArray(project.skills)) {
            project.skills.forEach(skill => {
              if (skill) skillsSet.add(skill);
            });
          }
        });
      }
    });
  }
  
  return Array.from(skillsSet);
};

// Normalize a skill using the mapping
export const normalizeSkill = (skill: string, skillMapping: Map<string, string>): string => {
  return skillMapping.get(skill) || skill;
};

// Create a standardized skill mapping from a set of candidates
export const createSkillNormalizationMapping = (candidates: Candidate[]): Map<string, string> => {
  const allSkills = extractAllSkills(candidates);
  const skillGroups = groupSimilarSkills(allSkills);
  return getRepresentativeSkills(skillGroups);
}; 