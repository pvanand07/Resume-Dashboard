import { Candidate, LocationCoordinates } from '../types';

// Map of city to approximate coordinates
const cityCoordinates: Record<string, LocationCoordinates> = {
  'Hyderabad, India': { lat: 17.385, lng: 78.4867 },
  'Ahmedabad, India': { lat: 23.0225, lng: 72.5714 },
  'Thanjavur, India': { lat: 10.7870, lng: 79.1378 },
  'Surat, Gujarat, India': { lat: 21.1702, lng: 72.8311 },
  'Navi Mumbai, India': { lat: 19.0330, lng: 73.0297 },
  'Mumbai, India': { lat: 19.0760, lng: 72.8777 },
  'Shirdi, Maharashtra, India': { lat: 19.7645, lng: 74.4763 },
  'Noida, India': { lat: 28.5355, lng: 77.3910 },
  'Bangalore, Karnataka, India': { lat: 12.9716, lng: 77.5946 },
  'Remote': { lat: 0, lng: 0 },
  'Unknown': { lat: 0, lng: 0 }
};

// Function to get coordinates based on location name
const getCoordinatesForLocation = (location: string): LocationCoordinates | null => {
  // Try exact match
  if (cityCoordinates[location]) {
    return cityCoordinates[location];
  }
  
  // Try partial match
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (location.includes(city.split(',')[0])) {
      return coords;
    }
  }
  
  // Generate random coordinates near India if no match
  // India's approximate bounds: lat 8-37, lng 68-97
  return {
    lat: 22 + (Math.random() * 8 - 4),
    lng: 78 + (Math.random() * 10 - 5)
  };
};

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