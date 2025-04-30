import { Candidate, FilterType, LocationCoordinates } from '../types';

export const filterCandidates = (
  candidates: Candidate[],
  filters: FilterType
): Candidate[] => {
  return candidates.filter(candidate => {
    // Skip candidates with errors
    if (candidate.error) {
      return false;
    }

    // Search filter (name, skills, location)
    if (filters.search && !matchesSearch(candidate, filters.search)) {
      return false;
    }

    // Experience filter
    if (
      filters.experience.length > 0 &&
      !filters.experience.includes(candidate.computed?.experience_level || '')
    ) {
      return false;
    }

    // Skills filter
    if (filters.skills.length > 0 && !matchesSkills(candidate, filters.skills)) {
      return false;
    }

    // Location filter
    if (
      filters.location.length > 0 &&
      !filters.location.includes(candidate.location || 'Unknown')
    ) {
      return false;
    }

    // Employment status filter
    if (
      filters.employmentStatus.length > 0 &&
      !filters.employmentStatus.includes(candidate.computed?.employment_status || '')
    ) {
      return false;
    }

    return true;
  });
};

const matchesSearch = (candidate: Candidate, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  if (!candidate) return false;
  
  const search = searchTerm.toLowerCase();
  
  // Search in name
  if (candidate.name && candidate.name.toLowerCase().includes(search)) {
    return true;
  }
  
  // Search in skills from work experience and projects
  const allSkills = new Set<string>();
  
  // Add skills from work experience if available
  if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
    candidate.work_experience.forEach(exp => {
      if (exp && exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach(skill => {
          if (skill) allSkills.add(skill);
        });
      }
    });
  }
  
  // Add skills from projects if available
  if (candidate.projects && Array.isArray(candidate.projects)) {
    candidate.projects.forEach(proj => {
      if (proj && proj.skills && Array.isArray(proj.skills)) {
        proj.skills.forEach(skill => {
          if (skill) allSkills.add(skill);
        });
      }
    });
  }
  
  if (Array.from(allSkills).some(skill => skill.toLowerCase().includes(search))) {
    return true;
  }
  
  // Search in location
  if (candidate.location && candidate.location.toLowerCase().includes(search)) {
    return true;
  }
  
  // Search in job titles
  if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
    if (candidate.work_experience.some(exp => 
      exp && exp.title && exp.title.toLowerCase().includes(search)
    )) {
      return true;
    }
  }
  
  // Search in companies
  if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
    if (candidate.work_experience.some(exp => 
      exp && exp.company && exp.company.toLowerCase().includes(search)
    )) {
      return true;
    }
  }
  
  // Search in project names
  if (candidate.projects && Array.isArray(candidate.projects)) {
    if (candidate.projects.some(project => 
      project && project.name && project.name.toLowerCase().includes(search)
    )) {
      return true;
    }
  }
  
  // Search in project descriptions
  if (candidate.projects && Array.isArray(candidate.projects)) {
    if (candidate.projects.some(project => 
      project && project.description && project.description.toLowerCase().includes(search)
    )) {
      return true;
    }
  }
  
  return false;
};

const matchesSkills = (candidate: Candidate, skills: string[]): boolean => {
  const candidateSkills = new Set<string>();
  
  // Add skills from work experience if available
  if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
    candidate.work_experience.forEach(exp => {
      if (exp && exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach(skill => candidateSkills.add(skill));
      }
    });
  }
  
  // Add skills from projects if available
  if (candidate.projects && Array.isArray(candidate.projects)) {
    candidate.projects.forEach(proj => {
      if (proj && proj.skills && Array.isArray(proj.skills)) {
        proj.skills.forEach(skill => candidateSkills.add(skill));
      }
    });
  }
  
  return skills.some(skill => candidateSkills.has(skill));
};

export const getUniqueLocations = (candidates: Candidate[]): { location: string; coordinates: LocationCoordinates | null }[] => {
  const locations = new Map<string, LocationCoordinates | null>();
  
  candidates.forEach(candidate => {
    if (candidate.location) {
      locations.set(candidate.location, candidate.location_coordinates);
    } else {
      locations.set('Unknown', null);
    }
  });
  
  return Array.from(locations.entries()).map(([location, coordinates]) => ({
    location,
    coordinates
  })).sort((a, b) => a.location.localeCompare(b.location));
};

export const getUniqueSkills = (candidates: Candidate[]): string[] => {
  const skills = new Set<string>();
  
  candidates.forEach(candidate => {
    if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
      candidate.work_experience.forEach(exp => {
        if (exp && exp.skills && Array.isArray(exp.skills)) {
          exp.skills.forEach(skill => skills.add(skill));
        }
      });
    }
    
    if (candidate.projects && Array.isArray(candidate.projects)) {
      candidate.projects.forEach(proj => {
        if (proj && proj.skills && Array.isArray(proj.skills)) {
          proj.skills.forEach(skill => skills.add(skill));
        }
      });
    }
  });
  
  return Array.from(skills).sort();
};

export const getExperienceLevels = (): string[] => {
  return [
    'No Experience',
    'Less than 1 year',
    '1-3 years',
    '3-5 years',
    '5+ years'
  ];
};

export const getEmploymentStatuses = (): string[] => {
  return ['Employed', 'Unemployed'];
};

export const exportCandidateData = (candidates: Candidate[]): void => {
  // Prepare data for export
  const exportData = candidates.map(candidate => ({
    name: candidate.name || 'Unknown',
    email: candidate.email || '',
    phone: candidate.phone || '',
    location: candidate.location || 'Unknown',
    github: candidate.github_url || '',
    linkedin: candidate.linkedin_url || '',
    experience_months: candidate.total_we_months || 0,
    experience_level: candidate.computed?.experience_level || 'Unknown',
    skills: candidate.computed?.skills?.join(', ') || '',
    score: candidate.computed?.score || 0,
    current_status: candidate.computed?.employment_status || 'Unknown',
    projects: candidate.projects && Array.isArray(candidate.projects) 
      ? candidate.projects.map(p => p?.name || 'Unnamed Project').join(', ')
      : ''
  }));
  
  // Convert to JSON
  const dataStr = JSON.stringify(exportData, null, 2);
  
  // Create and download file
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  const exportFileDefaultName = `candidate-data-${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Calculate distance between two coordinates using the Haversine formula
export const calculateDistance = (
  coordsA: LocationCoordinates,
  coordsB: LocationCoordinates
): number => {
  try {
    // Ensure coordinates are valid numbers
    const latA = Number(coordsA.lat);
    const lngA = Number(coordsA.lng);
    const latB = Number(coordsB.lat);
    const lngB = Number(coordsB.lng);
    
    if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) {
      console.warn('Invalid coordinates in distance calculation', { coordsA, coordsB });
      return NaN;
    }
    
    const R = 6371; // Earth's radius in km
    const dLat = (latB - latA) * Math.PI / 180;
    const dLng = (lngB - lngA) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latA * Math.PI / 180) * Math.cos(latB * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  } catch (error) {
    console.error('Error calculating distance:', error, { coordsA, coordsB });
    return NaN;
  }
};

// Sort candidates based on provided sort option
export const sortCandidates = (
  candidates: Candidate[], 
  sortOption: SortOption,
  referenceLocation?: LocationCoordinates
): Candidate[] => {
  const sortedCandidates = [...candidates];
  
  switch (sortOption.field) {
    case 'name':
      sortedCandidates.sort((a, b) => {
        return sortOption.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
      break;
      
    case 'score':
      sortedCandidates.sort((a, b) => {
        const scoreA = a.computed?.score || 0;
        const scoreB = b.computed?.score || 0;
        return sortOption.direction === 'asc' 
          ? scoreA - scoreB
          : scoreB - scoreA;
      });
      break;
      
    case 'experience':
      sortedCandidates.sort((a, b) => {
        const expA = a.total_we_months || 0;
        const expB = b.total_we_months || 0;
        return sortOption.direction === 'asc' 
          ? expA - expB
          : expB - expA;
      });
      break;
      
    case 'distance':
      if (!referenceLocation) {
        // If no reference location, sort alphabetically by location name
        sortedCandidates.sort((a, b) => {
          return sortOption.direction === 'asc'
            ? a.location.localeCompare(b.location)
            : b.location.localeCompare(a.location);
        });
      } else {
        // Sort by distance using the Haversine formula
        sortedCandidates.sort((a, b) => {
          const coordsA = a.location_coordinates;
          const coordsB = b.location_coordinates;
          
          // Check if coordinates exist and are valid
          const isValidA = coordsA && typeof coordsA.lat === 'number' && typeof coordsA.lng === 'number';
          const isValidB = coordsB && typeof coordsB.lat === 'number' && typeof coordsB.lng === 'number';
          
          // If locations don't have valid coordinates, place them at the end
          if (!isValidA && !isValidB) return 0;
          if (!isValidA) return sortOption.direction === 'asc' ? 1 : -1;
          if (!isValidB) return sortOption.direction === 'asc' ? -1 : 1;
          
          try {
            const distanceA = calculateDistance(referenceLocation, coordsA);
            const distanceB = calculateDistance(referenceLocation, coordsB);
            
            // Check if distances are valid numbers
            if (isNaN(distanceA) && isNaN(distanceB)) return 0;
            if (isNaN(distanceA)) return sortOption.direction === 'asc' ? 1 : -1;
            if (isNaN(distanceB)) return sortOption.direction === 'asc' ? -1 : 1;
            
            return sortOption.direction === 'asc'
              ? distanceA - distanceB
              : distanceB - distanceA;
          } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
          }
        });
      }
      break;
  }
  
  return sortedCandidates;
};