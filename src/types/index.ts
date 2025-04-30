export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  github_url: string;
  linkedin_url: string;
  location: string;
  location_coordinates?: LocationCoordinates | null;
  work_experience: WorkExperience[];
  projects: Project[];
  total_we_months: number;
  source_file: string;
  file_hash: string;
  error?: string;
  computed?: {
    score: number;
    experience_level: string;
    employment_status: string;
  };
}

export interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  location: string;
  responsibilities: string[];
  skills: string[];
}

export interface Project {
  name: string;
  description: string;
  skills: string[];
  url: string;
}

export type FilterType = {
  search: string;
  experience: string[];
  skills: string[];
  location: string[];
  employmentStatus: string[];
  jobRequirement: string;
};

export type DataVisualization = {
  type: 'experienceDistribution' | 'skillsDistribution' | 'locationDistribution';
  data: any[];
};

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export type SortOption = {
  field: 'name' | 'score' | 'distance' | 'experience';
  direction: 'asc' | 'desc';
};

// Create a new interface for skill group mapping
export interface NormalizedSkillsMap {
  // Maps a normalized skill name to all variations of that skill
  [normalizedSkill: string]: string[];
}

// Export type for skill normalization mapping
export type SkillNormalizationMap = Map<string, string>;
export type GroupedSkillsMap = Map<string, string[]>;