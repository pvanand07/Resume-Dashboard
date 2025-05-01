import { Candidate, LocationCoordinates } from '../types';

// Fetch resume data from the provided URL
export const fetchCandidatesData = async (): Promise<Candidate[]> => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/pvanand07/ai-candidates-dashboard/refs/heads/master/resumes.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch candidates data');
    }
    
    const data = await response.json();
    
    // Transform the data into the expected format and filter out candidates with errors
    const candidates: Candidate[] = Object.entries(data)
      .filter(([_, candidateData]: [string, any]) => !candidateData.error)
      .map(([id, candidateData]: [string, any]) => {
        // Convert location coordinates from latitude/longitude to lat/lng format
        let coordinates = null;
        if (candidateData.location_coordinates) {
          coordinates = {
            lat: candidateData.location_coordinates.latitude,
            lng: candidateData.location_coordinates.longitude
          };
        }
        
        return {
          id,
          ...candidateData,
          // Replace the original coordinates with our formatted ones
          location_coordinates: coordinates,
          computed: {
            score: calculateCandidateScore(candidateData),
            experience_level: categorizeExperience(candidateData.total_we_months),
            employment_status: determineEmploymentStatus(candidateData.work_experience),
          }
        };
      });
    
    console.log('Sample candidate coordinates:', 
      candidates.slice(0, 3).map(c => ({
        name: c.name, 
        location: c.location,
        coordinates: c.location_coordinates
      }))
    );
    
    return candidates;
  } catch (error) {
    console.error('Error fetching candidates data:', error);
    return [];
  }
};

// Helper functions for data processing
const calculateCandidateScore = (candidate: any): number => {
  // Base score from experience (0-50 points)
  const experienceScore = Math.min(candidate.total_we_months * 0.5, 50);
  
  // Skills score (0-30 points)
  const skillsCount = new Set([
    ...candidate.work_experience?.flatMap((exp: any) => exp.skills || []) || [],
    ...candidate.projects?.flatMap((proj: any) => proj.skills || []) || []
  ]).size;

  console.log(`Candidate ${candidate.name} has ${skillsCount} unique skills`);
  
  const skillsScore = Math.min(skillsCount * 3, 30);
  
  // Project score (0-20 points)
  const projectScore = Math.min((candidate.projects?.length || 0) * 5, 20);
  
  return Math.round(experienceScore + skillsScore + projectScore);
};

const categorizeExperience = (months: number): string => {
  if (months === 0) return 'No Experience';
  if (months < 12) return 'Less than 1 year';
  if (months < 36) return '1-3 years';
  if (months < 60) return '3-5 years';
  return '5+ years';
};

const determineEmploymentStatus = (workExperience: any[]): string => {
  if (!workExperience || workExperience.length === 0) return 'Unemployed';
  
  const hasCurrentJob = workExperience.some(exp => exp.is_current === true);
  return hasCurrentJob ? 'Employed' : 'Unemployed';
};