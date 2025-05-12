import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Cache keys for localStorage
const CACHE_KEYS = {
  CANDIDATES: 'dashboard_candidates',
  SKILL_MAPPING: 'dashboard_skill_mapping',
  LOCATIONS: 'dashboard_locations',
  SKILL_COUNTS: 'dashboard_skill_counts',
  SKILLS_LIST: 'dashboard_skills_list',
  CACHED_TIMESTAMP: 'dashboard_cache_timestamp'
};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

interface Location {
  location: string;
  coordinates: LocationCoordinates | null;
}

// Pagination interface
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

const Dashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [paginatedCandidates, setPaginatedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculatingScores, setCalculatingScores] = useState<boolean>(false);

  // Caching state
  const [isCacheLoaded, setIsCacheLoaded] = useState<boolean>(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 50, // Show 12 candidates per page (4 rows of 3 cards)
    totalPages: 1,
  });
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

  // Cache helper functions
  const saveToCache = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to cache (${key}):`, error);
    }
  }, []);

  const getFromCache = useCallback((key: string) => {
    try {
      const cachedItem = localStorage.getItem(key);
      return cachedItem ? JSON.parse(cachedItem) : null;
    } catch (error) {
      console.error(`Error reading from cache (${key}):`, error);
      return null;
    }
  }, []);

  const isCacheValid = useCallback(() => {
    const timestamp = getFromCache(CACHE_KEYS.CACHED_TIMESTAMP);
    if (!timestamp) return false;
    
    const now = Date.now();
    return (now - timestamp) < CACHE_EXPIRATION;
  }, [getFromCache]);

  const clearCache = useCallback(() => {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  const saveCacheTimestamp = useCallback(() => {
    localStorage.setItem(CACHE_KEYS.CACHED_TIMESTAMP, JSON.stringify(Date.now()));
  }, []);
  
  const experienceLevels = useMemo(() => getExperienceLevels(), []);
  const employmentStatuses = useMemo(() => getEmploymentStatuses(), []);
  
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
  
  // Calculate the number of candidates who have each skill - memoized to improve performance
  const calculateSkillCounts = useCallback((candidatesList: Candidate[]): Map<string, number> => {
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
  }, []);
  
  // Load data from cache or fetch it
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from cache first
        if (isCacheValid()) {
          const cachedCandidates = getFromCache(CACHE_KEYS.CANDIDATES);
          const cachedSkillMapping = getFromCache(CACHE_KEYS.SKILL_MAPPING);
          const cachedLocations = getFromCache(CACHE_KEYS.LOCATIONS);
          const cachedSkillCounts = getFromCache(CACHE_KEYS.SKILL_COUNTS);
          const cachedSkillsList = getFromCache(CACHE_KEYS.SKILLS_LIST);
          
          if (cachedCandidates && cachedSkillMapping && cachedLocations && 
              cachedSkillCounts && cachedSkillsList) {
            console.log('Loading data from cache');
            
            setCandidates(cachedCandidates);
            
            // Convert JSON objects back to Maps
            const skillMap = new Map(Object.entries(cachedSkillMapping));
            setOriginalToNormalizedMap(skillMap);
            
            // Construct the grouped skills map
            const groupedMap = new Map();
            skillMap.forEach((normalizedSkill, originalSkill) => {
              if (!groupedMap.has(normalizedSkill)) {
                groupedMap.set(normalizedSkill, []);
              }
              const group = groupedMap.get(normalizedSkill);
              if (group) {
                group.push(originalSkill);
              }
            });
            setGroupedSkillsMap(groupedMap);
            
            setLocationsList(cachedLocations);
            
            // Convert skill counts back to Map
            const countsMap = new Map(Object.entries(cachedSkillCounts));
            setSkillCounts(countsMap);
            
            setSkillsList(cachedSkillsList);
            setFilteredCandidates(cachedCandidates);
            
            // Calculate initial pagination
            setPagination(prev => ({
              ...prev,
              totalPages: Math.ceil(cachedCandidates.length / prev.itemsPerPage)
            }));
            
            setIsCacheLoaded(true);
            setLoading(false);
            return;
          }
        }
        
        console.log('Fetching fresh data');
        const data = await fetchCandidatesData();
        setCandidates(data);
        
        // Create skill normalization mapping (expensive operation)
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
        const locations = getUniqueLocations(data);
        setLocationsList(locations);
        
        // Calculate skill counts (expensive operation)
        const counts = calculateSkillCounts(data);
        setSkillCounts(counts);
        
        setFilteredCandidates(data);
        
        // Calculate initial pagination
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(data.length / prev.itemsPerPage)
        }));
        
        // Cache the data for future use
        saveToCache(CACHE_KEYS.CANDIDATES, data);
        saveToCache(CACHE_KEYS.SKILL_MAPPING, Object.fromEntries(skillMapping));
        saveToCache(CACHE_KEYS.LOCATIONS, locations);
        saveToCache(CACHE_KEYS.SKILL_COUNTS, Object.fromEntries(counts));
        saveToCache(CACHE_KEYS.SKILLS_LIST, uniqueNormalizedSkills);
        saveCacheTimestamp();
        
        setIsCacheLoaded(true);
        setLoading(false);
      } catch (error) {
        console.error('Error loading candidates data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [calculateSkillCounts, getFromCache, isCacheValid, saveToCache, saveCacheTimestamp]);
  
  // Memoize filtered and scored candidates to avoid recomputation
  const getFilteredAndScoredCandidates = useCallback((
    candidates: Candidate[], 
    filters: FilterType, 
    sortOption: SortOption, 
    userLocation?: LocationCoordinates
  ) => {
    // Use normalized candidates for filtering
    const filtered = filterCandidates(candidates, filters);
    
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
    return sortCandidates(scoredCandidates, sortOption, userLocation);
  }, []);
  
  // Apply filters when changed, using debounce for search input
  useEffect(() => {
    // Skip if candidates are not loaded
    if (!isCacheLoaded || normalizedCandidates.length === 0) {
      return;
    }
    
    const applyFiltersAndCalculateScores = async () => {
      // Set calculating state if job requirement has changed
      const jobRequirementChanged = 
        filters.jobRequirement !== undefined && 
        filters.jobRequirement.length > 0;
      
      if (jobRequirementChanged) {
        setCalculatingScores(true);
      }
      
      try {
        // Get filtered and scored candidates
        const sortedCandidates = getFilteredAndScoredCandidates(
          normalizedCandidates, 
          filters, 
          sortOption, 
          userLocation
        );
        
        setFilteredCandidates(sortedCandidates);
        
        // Reset to first page when filters change and update total pages
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: Math.ceil(sortedCandidates.length / prev.itemsPerPage)
        }));
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        // Clear calculating state
        if (jobRequirementChanged) {
          setCalculatingScores(false);
        }
      }
    };
    
    // Use debounce to prevent excessive recalculations
    const timeoutId = setTimeout(() => {
      applyFiltersAndCalculateScores();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [
    filters, 
    sortOption, 
    userLocation, 
    normalizedCandidates, 
    isCacheLoaded, 
    getFilteredAndScoredCandidates
  ]);
  
  // Update paginated candidates when filtered list or pagination changes
  useEffect(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    setPaginatedCandidates(filteredCandidates.slice(start, end));
  }, [filteredCandidates, pagination.currentPage, pagination.itemsPerPage]);
  
  const handleFilterChange = useCallback((newFilters: FilterType) => {
    setFilters(newFilters);
  }, []);
  
  const handleSortChange = useCallback((newSortOption: SortOption) => {
    setSortOption(newSortOption);
  }, []);
  
  const handleLocationChange = useCallback((location: LocationCoordinates | undefined) => {
    setUserLocation(location);
  }, []);
  
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  }, []);
  
  // Clear cache function exposed for testing
  const handleClearCache = () => {
    clearCache();
    window.location.reload();
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
          candidates={paginatedCandidates}
          totalCandidates={filteredCandidates.length}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          userLocation={userLocation}
          onUserLocationChange={handleLocationChange}
          groupedSkillsMap={groupedSkillsMap}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
      
      {/* Debug button for development - can be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 text-center">
          <button 
            onClick={handleClearCache}
            className="text-xs text-gray-500 underline"
          >
            Clear cache and reload
          </button>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;