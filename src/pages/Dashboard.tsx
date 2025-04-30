import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, FilterType, LocationCoordinates, SortOption, SkillNormalizationMap, GroupedSkillsMap } from '../types';
import Layout from '../components/layout/Layout';
import FilterPanel from '../components/dashboard/FilterPanel';
import CandidatesList from '../components/dashboard/CandidatesList';
import { fetchCandidatesData } from '../data/candidatesData';
import { 
  filterCandidates, 
  getUniqueLocations, 
  getExperienceLevels,
  getEmploymentStatuses,
  sortCandidates
} from '../utils/filterUtils';
import { calculateTotalCandidateScore } from '../utils/tfidfUtils';
import { createSkillNormalizationMapping, normalizeSkill, extractAllSkills } from '../utils/skillNormalizationUtils';
import { Loader2 } from 'lucide-react';

interface Location {
  location: string;
  coordinates: LocationCoordinates | null;
}

const Dashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculatingScores, setCalculatingScores] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    experience: [],
    skills: [],
    location: [],
    employmentStatus: [],
    jobRequirement: 'Seeking an AI Engineer with expertise in machine learning, Python, TensorFlow, and deep learning. Experience with natural language processing, computer vision, and deployment of ML models to production environments is highly desired.',
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'score',
    direction: 'desc'
  });
  const [userLocation, setUserLocation] = useState<LocationCoordinates | undefined>();
  
  // Lists for filter options
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [groupedSkillsMap, setGroupedSkillsMap] = useState<GroupedSkillsMap>(new Map());
  const [originalToNormalizedMap, setOriginalToNormalizedMap] = useState<SkillNormalizationMap>(new Map());
  
  // Add state for skill counts
  const [skillCounts, setSkillCounts] = useState<Map<string, number>>(new Map());
  
  const experienceLevels = getExperienceLevels();
  const employmentStatuses = getEmploymentStatuses();
  
  // Create normalized candidates with standardized skills
  const normalizedCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0 || !originalToNormalizedMap.size) {
      return candidates;
    }
    
    return candidates.map(candidate => {
      // Create a deep copy to avoid modifying the original data
      const normalizedCandidate = { ...candidate };
      
      // Normalize work experience skills
      if (normalizedCandidate.work_experience && Array.isArray(normalizedCandidate.work_experience)) {
        normalizedCandidate.work_experience = normalizedCandidate.work_experience.map(exp => {
          if (exp && exp.skills && Array.isArray(exp.skills)) {
            return {
              ...exp,
              skills: exp.skills.map(skill => 
                normalizeSkill(skill, originalToNormalizedMap)
              )
            };
          }
          return exp;
        });
      }
      
      // Normalize project skills
      if (normalizedCandidate.projects && Array.isArray(normalizedCandidate.projects)) {
        normalizedCandidate.projects = normalizedCandidate.projects.map(project => {
          if (project && project.skills && Array.isArray(project.skills)) {
            return {
              ...project,
              skills: project.skills.map(skill => 
                normalizeSkill(skill, originalToNormalizedMap)
              )
            };
          }
          return project;
        });
      }
      
      return normalizedCandidate;
    });
  }, [candidates, originalToNormalizedMap]);
  
  // Calculate the number of candidates who have each skill
  const calculateSkillCounts = (candidatesList: Candidate[]): Map<string, number> => {
    const counts = new Map<string, number>();
    
    if (candidatesList && Array.isArray(candidatesList)) {
      candidatesList.forEach(candidate => {
        // Extract all skills from this candidate
        const candidateSkills = new Set<string>();
        
        // Add skills from work experience
        if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
          candidate.work_experience.forEach(exp => {
            if (exp.skills && Array.isArray(exp.skills)) {
              exp.skills.forEach(skill => {
                if (skill) candidateSkills.add(skill);
              });
            }
          });
        }
        
        // Add skills from projects
        if (candidate.projects && Array.isArray(candidate.projects)) {
          candidate.projects.forEach(project => {
            if (project.skills && Array.isArray(project.skills)) {
              project.skills.forEach(skill => {
                if (skill) candidateSkills.add(skill);
              });
            }
          });
        }
        
        // Increment the count for each skill
        candidateSkills.forEach(skill => {
          counts.set(skill, (counts.get(skill) || 0) + 1);
        });
      });
    }
    
    return counts;
  };
  
  // Fetch candidates data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCandidatesData();
        setCandidates(data);
        
        // Calculate skill counts
        const counts = calculateSkillCounts(data);
        setSkillCounts(counts);
        
        // Create skill normalization mapping
        const skillMapping = createSkillNormalizationMapping(data);
        setOriginalToNormalizedMap(skillMapping);
        
        // Create a reverse mapping for display purposes (normalized -> group)
        const normalizedToGroupMap = new Map<string, string[]>();
        skillMapping.forEach((normalizedSkill, originalSkill) => {
          if (!normalizedToGroupMap.has(normalizedSkill)) {
            normalizedToGroupMap.set(normalizedSkill, []);
          }
          const group = normalizedToGroupMap.get(normalizedSkill);
          if (group) {
            group.push(originalSkill);
          }
        });
        setGroupedSkillsMap(normalizedToGroupMap);
        
        // Extract unique normalized skills for filtering
        const uniqueNormalizedSkills = Array.from(new Set(skillMapping.values()));
        setSkillsList(uniqueNormalizedSkills);
        
        // Extract locations
        setLocationsList(getUniqueLocations(data));
        
        setFilteredCandidates(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading candidates data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Apply filters when changed
  useEffect(() => {
    const applyFiltersAndCalculateScores = async () => {
      // Set calculating state if job requirement has changed
      const jobRequirementChanged = 
        filters.jobRequirement !== undefined && 
        filters.jobRequirement.length > 0;
      
      if (jobRequirementChanged) {
        setCalculatingScores(true);
      }
      
      try {
        // Use normalized candidates for filtering
        const filtered = filterCandidates(normalizedCandidates, filters);
        
        // Recalculate scores based on job requirements
        const scoredCandidates = filtered.map(candidate => {
          const newScore = calculateTotalCandidateScore(candidate, filters.jobRequirement);
          return {
            ...candidate,
            computed: {
              ...candidate.computed,
              score: newScore,
              experience_level: candidate.computed?.experience_level || 'No Experience',
              employment_status: candidate.computed?.employment_status || 'Unemployed'
            }
          };
        });
        
        // Apply sorting
        const sorted = sortCandidates(scoredCandidates, sortOption, userLocation);
        setFilteredCandidates(sorted);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        // Clear calculating state
        if (jobRequirementChanged) {
          setCalculatingScores(false);
        }
      }
    };
    
    if (normalizedCandidates.length > 0) {
      applyFiltersAndCalculateScores();
    }
  }, [normalizedCandidates, filters, sortOption, userLocation]);
  
  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };
  
  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
  };
  
  const handleLocationChange = (location: LocationCoordinates | undefined) => {
    setUserLocation(location);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4" />
            <p className="text-lg text-gray-600">Loading candidates data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        experienceLevels={experienceLevels}
        skillsList={skillsList}
        locationsList={locationsList}
        employmentStatuses={employmentStatuses}
        groupedSkillsMap={groupedSkillsMap}
        countsBySkill={skillCounts}
      />
      
      {calculatingScores ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4" />
            <p className="text-lg text-gray-600">Calculating candidate matches...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment for large datasets.</p>
          </div>
        </div>
      ) : (
        <CandidatesList
          candidates={filteredCandidates}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          userLocation={userLocation}
          onUserLocationChange={handleLocationChange}
          groupedSkillsMap={groupedSkillsMap}
        />
      )}
    </Layout>
  );
};

export default Dashboard;