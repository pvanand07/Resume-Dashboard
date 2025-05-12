import React, { useState, useEffect, useCallback } from 'react';
import { FilterType, LocationCoordinates, GroupedSkillsMap } from '../../types';
import { Search, X, Filter, ChevronDown, ChevronUp, MapPin, Check, Info, Users } from 'lucide-react';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Location {
  location: string;
  coordinates: LocationCoordinates | null;
}

interface FilterPanelProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  experienceLevels: string[];
  skillsList: string[];
  locationsList: Location[];
  employmentStatuses: string[];
  groupedSkillsMap?: GroupedSkillsMap;
  countsBySkill?: Map<string, number>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  experienceLevels,
  skillsList,
  locationsList,
  employmentStatuses,
  groupedSkillsMap,
  countsBySkill = new Map()
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);
  const [localJobRequirement, setLocalJobRequirement] = useState(filters.jobRequirement);
  const [isJobRequirementUpdating, setIsJobRequirementUpdating] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  // Debounce the search input to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(localFilters.search, 300);
  
  // Update local state when props change
  useEffect(() => {
    setLocalJobRequirement(filters.jobRequirement);
    setLocalFilters(filters);
  }, [filters]);
  
  // Apply the debounced search term to the actual filters
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      onFilterChange({
        ...filters,
        search: debouncedSearchTerm,
      });
    }
  }, [debouncedSearchTerm, filters, onFilterChange]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({
      ...prev,
      search: e.target.value,
    }));
  }, []);
  
  const handleLocalJobRequirementChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalJobRequirement(e.target.value);
  }, []);
  
  const handleApplyJobRequirement = useCallback(() => {
    if (localJobRequirement === filters.jobRequirement) return;
    
    setIsJobRequirementUpdating(true);
    
    // Use setTimeout to allow UI to update with loading state before heavy calculation starts
    setTimeout(() => {
      onFilterChange({
        ...filters,
        jobRequirement: localJobRequirement,
      });
      
      // Add a small delay to ensure the loading state is visible
      setTimeout(() => {
        setIsJobRequirementUpdating(false);
      }, 500);
    }, 100);
  }, [filters, localJobRequirement, onFilterChange]);
  
  const handleExperienceChange = useCallback((level: string) => {
    const updatedExperience = filters.experience.includes(level)
      ? filters.experience.filter((exp) => exp !== level)
      : [...filters.experience, level];
    
    onFilterChange({
      ...filters,
      experience: updatedExperience,
    });
  }, [filters, onFilterChange]);
  
  const handleSkillChange = useCallback((skill: string) => {
    const updatedSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    
    // Toggle expanded state when skill is selected
    const newExpandedSkills = new Set(expandedSkills);
    if (updatedSkills.includes(skill)) {
      newExpandedSkills.add(skill);
    } else {
      newExpandedSkills.delete(skill);
    }
    setExpandedSkills(newExpandedSkills);
    
    onFilterChange({
      ...filters,
      skills: updatedSkills,
    });
  }, [filters, expandedSkills, onFilterChange]);
  
  const handleLocationChange = useCallback((location: string) => {
    const updatedLocations = filters.location.includes(location)
      ? filters.location.filter((loc) => loc !== location)
      : [...filters.location, location];
    
    onFilterChange({
      ...filters,
      location: updatedLocations,
    });
  }, [filters, onFilterChange]);
  
  const handleEmploymentStatusChange = useCallback((status: string) => {
    const updatedStatuses = filters.employmentStatus.includes(status)
      ? filters.employmentStatus.filter((s) => s !== status)
      : [...filters.employmentStatus, status];
    
    onFilterChange({
      ...filters,
      employmentStatus: updatedStatuses,
    });
  }, [filters, onFilterChange]);
  
  const clearFilters = useCallback(() => {
    setLocalFilters(prev => ({
      ...prev,
      search: '',
      experience: [],
      skills: [],
      location: [],
      employmentStatus: [],
    }));
    
    onFilterChange({
      search: '',
      experience: [],
      skills: [],
      location: [],
      employmentStatus: [],
      jobRequirement: filters.jobRequirement,
    });
  }, [filters.jobRequirement, onFilterChange]);
  
  const hasActiveFilters = useCallback(() => {
    return (
      filters.search !== '' ||
      filters.experience.length > 0 ||
      filters.skills.length > 0 ||
      filters.location.length > 0 ||
      filters.employmentStatus.length > 0
    );
  }, [filters]);

  // Get related skills for a normalized skill
  const getRelatedSkills = useCallback((normalizedSkill: string): string[] => {
    if (!groupedSkillsMap) return [normalizedSkill];
    return groupedSkillsMap.get(normalizedSkill) || [normalizedSkill];
  }, [groupedSkillsMap]);
  
  // Get candidate count for a skill
  const getCandidateCount = useCallback((skill: string): number => {
    return countsBySkill.get(skill) || 0;
  }, [countsBySkill]);
  
  // Toggle expansion of a skill's related skills
  const toggleSkillExpansion = useCallback((skill: string) => {
    const newExpandedSkills = new Set(expandedSkills);
    if (newExpandedSkills.has(skill)) {
      newExpandedSkills.delete(skill);
    } else {
      newExpandedSkills.add(skill);
    }
    setExpandedSkills(newExpandedSkills);
  }, [expandedSkills]);

  // Memoize the skills list for rendering optimization
  const renderedSkillsList = React.useMemo(() => {
    return skillsList.slice(0, 20).map((skill) => (
      <div key={skill} className="relative">
        <div className="flex items-center group">
          <label className="flex items-center flex-1 cursor-pointer py-1">
            <input
              type="checkbox"
              className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
              checked={filters.skills.includes(skill)}
              onChange={() => handleSkillChange(skill)}
            />
            <span className="ml-2 text-sm text-gray-700">{skill}</span>
          </label>
          
          {/* Show candidate count */}
          {getCandidateCount(skill) > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex items-center">
              <Users size={10} className="mr-0.5" />
              {getCandidateCount(skill)}
            </span>
          )}
          
          {/* Show expand button for skills with variations */}
          {groupedSkillsMap && getRelatedSkills(skill).length > 1 && (
            <button
              className="ml-1 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => toggleSkillExpansion(skill)}
              title={expandedSkills.has(skill) ? "Hide related skills" : "Show related skills"}
            >
              {expandedSkills.has(skill) ? 
                <ChevronUp size={14} /> : 
                <ChevronDown size={14} />
              }
            </button>
          )}
        </div>
        
        {/* Related skills section - shown when skill is selected or manually expanded */}
        {groupedSkillsMap && 
         getRelatedSkills(skill).length > 1 && 
         (filters.skills.includes(skill) || expandedSkills.has(skill)) && (
          <div className="ml-6 mt-1 mb-2 border-l-2 border-primary-100 pl-2 text-xs">
            <div className="text-gray-500 mb-1 flex items-center">
              <Info size={10} className="mr-1 text-primary-400" />
              Related skills:
            </div>
            <div className="flex flex-wrap gap-1">
              {getRelatedSkills(skill)
                .filter(variant => variant !== skill) // Don't show the main skill again
                .map((variant, i) => (
                  <div key={i} className="flex items-center">
                    <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
                      {variant}
                    </span>
                    {getCandidateCount(variant) > 0 && (
                      <span className="ml-1 text-gray-400 text-[10px]">
                        ({getCandidateCount(variant)})
                      </span>
                    )}
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  }, [skillsList, filters.skills, expandedSkills, groupedSkillsMap, getCandidateCount, getRelatedSkills, handleSkillChange, toggleSkillExpansion]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
      <div className="p-4">
        {/* Job Requirement Input with inline button */}
        <div className="mb-4">
          <label htmlFor="jobRequirement" className="block text-sm font-medium text-gray-700 mb-1">
            Job Requirement
          </label>
          <div className="relative">
            <textarea
              id="jobRequirement"
              className="block w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
              placeholder="Enter job requirements to match candidates against..."
              value={localJobRequirement}
              onChange={handleLocalJobRequirementChange}
            />
            <button
              className={`absolute right-2 bottom-2 flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isJobRequirementUpdating 
                  ? 'bg-gray-300 text-gray-600 cursor-wait' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              onClick={handleApplyJobRequirement}
              disabled={isJobRequirementUpdating}
            >
              {isJobRequirementUpdating ? (
                <>
                  <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Check size={14} className="mr-1" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search candidates by name, skills, location..."
            value={localFilters.search}
            onChange={handleSearchChange}
          />
          {localFilters.search && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => {
                setLocalFilters(prev => ({ ...prev, search: '' }));
                onFilterChange({ ...filters, search: '' });
              }}
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <button
            className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-1" />
            Advanced Filters
            {showFilters ? (
              <ChevronUp size={16} className="ml-1" />
            ) : (
              <ChevronDown size={16} className="ml-1" />
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              onClick={clearFilters}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {showFilters && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Experience Filter */}
            <div>
              <h3 className="font-medium text-sm text-gray-700 mb-2">Experience</h3>
              <div className="space-y-1">
                {experienceLevels.map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                      checked={filters.experience.includes(level)}
                      onChange={() => handleExperienceChange(level)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Skills Filter */}
            <div>
              <h3 className="font-medium text-sm text-gray-700 mb-2">Skills</h3>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-0.5">
                {renderedSkillsList}
              </div>
            </div>
            
            {/* Location Filter */}
            <div>
              <h3 className="font-medium text-sm text-gray-700 mb-2">Location</h3>
              <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                {locationsList.map(({ location, coordinates }) => (
                  <label key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                      checked={filters.location.includes(location)}
                      onChange={() => handleLocationChange(location)}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      {location || 'Unknown'}
                      {coordinates && (
                        <MapPin size={12} className="ml-1 text-gray-400" />
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Employment Status Filter */}
            <div>
              <h3 className="font-medium text-sm text-gray-700 mb-2">Employment Status</h3>
              <div className="space-y-1">
                {employmentStatuses.map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                      checked={filters.employmentStatus.includes(status)}
                      onChange={() => handleEmploymentStatusChange(status)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
          {filters.experience.map(exp => (
            <span key={exp} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {exp}
              <button 
                className="ml-1 focus:outline-none" 
                onClick={() => handleExperienceChange(exp)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          
          {filters.skills.map(skill => (
            <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {skill}
              <button 
                className="ml-1 focus:outline-none" 
                onClick={() => handleSkillChange(skill)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          
          {filters.location.map(loc => (
            <span key={loc} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {loc}
              <button 
                className="ml-1 focus:outline-none" 
                onClick={() => handleLocationChange(loc)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          
          {filters.employmentStatus.map(status => (
            <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {status}
              <button 
                className="ml-1 focus:outline-none" 
                onClick={() => handleEmploymentStatusChange(status)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              "{filters.search}"
              <button 
                className="ml-1 focus:outline-none" 
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, search: '' }));
                  onFilterChange({ ...filters, search: '' });
                }}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FilterPanel);