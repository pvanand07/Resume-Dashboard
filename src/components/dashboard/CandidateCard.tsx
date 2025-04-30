import React, { useState } from 'react';
import { Candidate, LocationCoordinates, GroupedSkillsMap } from '../../types';
import { MapPin, Briefcase, Award, Github as GitHub, Linkedin, Mail, Phone, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { calculateDistance } from '../../utils/filterUtils';

interface CandidateCardProps {
  candidate: Candidate;
  userLocation?: LocationCoordinates;
  groupedSkillsMap?: GroupedSkillsMap;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate,
  userLocation,
  groupedSkillsMap
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Skip rendering if candidate has an error
  if (candidate.error) {
    return null;
  }
  
  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    try {
      return format(parseISO(dateString), 'MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Get unique skills from work experience and projects
  const getUniqueSkills = (): string[] => {
    const skillsSet = new Set<string>();
    
    // Add work experience skills
    if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
      candidate.work_experience.forEach(exp => {
        if (exp.skills && Array.isArray(exp.skills)) {
          exp.skills.forEach(skill => {
            if (skill) skillsSet.add(skill);
          });
        }
      });
    }
    
    // Add project skills
    if (candidate.projects && Array.isArray(candidate.projects)) {
      candidate.projects.forEach(proj => {
        if (proj.skills && Array.isArray(proj.skills)) {
          proj.skills.forEach(skill => {
            if (skill) skillsSet.add(skill);
          });
        }
      });
    }
    
    return Array.from(skillsSet);
  };
  
  const uniqueSkills = getUniqueSkills();
  
  // Helper to check if a skill is a normalized version (represents a group)
  const isNormalizedSkill = (skill: string): boolean => {
    if (!groupedSkillsMap) return false;
    return groupedSkillsMap.has(skill) && (groupedSkillsMap.get(skill)?.length || 0) > 1;
  };

  // Calculate distance if user location and candidate location coordinates are available
  const distance = userLocation && candidate.location_coordinates && 
    typeof candidate.location_coordinates.lat === 'number' && 
    typeof candidate.location_coordinates.lng === 'number'
    ? calculateDistance(userLocation, candidate.location_coordinates)
    : null;

  // Format distance for display
  const formatDistance = (dist: number | null): string => {
    if (dist === null || isNaN(dist)) return '';
    
    // For remote or very far locations, just say "Remote"
    if (candidate.location === 'Remote' || dist > 10000) {
      return 'Remote';
    }
    
    // For close distances, show in km with one decimal place
    return `${Math.round(dist * 10) / 10} km`;
  };

  const distanceText = formatDistance(distance);

  // Remove the debugging console.log in production
  /* Debug information, uncomment if needed
  if (process.env.NODE_ENV === 'development') {
    console.log('Candidate coordinates:', candidate.name, candidate.location_coordinates);
  }
  */

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{candidate.name}</h3>
            <p className="text-sm text-gray-600">
              {candidate.work_experience && candidate.work_experience.length > 0 
                ? candidate.work_experience[0]?.title || 'No current position'
                : 'No current position'}
              {candidate.work_experience && candidate.work_experience.length > 0 && candidate.work_experience[0]?.company && 
                ` at ${candidate.work_experience[0].company}`}
            </p>
          </div>
          <div>
            <div className="flex items-center mb-1">
              <span 
                className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                  ${candidate.computed?.score ? (
                    candidate.computed.score >= 70 ? 'bg-success-500' :
                    candidate.computed.score >= 40 ? 'bg-warning-500' :
                    'bg-error-500'
                  ) : 'bg-gray-400'}`}
              >
                {candidate.computed?.score || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Match
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-y-2">
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <MapPin size={16} className="mr-1 text-gray-400" />
            <span>{candidate.location || 'Location not specified'}</span>
            {distanceText && (
              <span className="ml-1 text-xs text-primary-600">
                ({distanceText})
              </span>
            )}
          </div>
          
          {candidate.computed?.experience_level && (
            <div className="flex items-center text-sm text-gray-600 mr-4">
              <Briefcase size={16} className="mr-1 text-gray-400" />
              <span>{candidate.computed.experience_level}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Award size={16} className="mr-1 text-gray-400" />
            <span>{candidate.computed?.employment_status || 'Unknown'}</span>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {uniqueSkills.slice(0, 4).map((skill, index) => (
            <span 
              key={index} 
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isNormalizedSkill(skill) 
                  ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                  : 'bg-primary-50 text-primary-700'
              }`}
            >
              {skill}
              {isNormalizedSkill(skill) && (
                <span className="ml-1 text-xs bg-primary-200 text-primary-800 px-1 rounded-full">
                  {groupedSkillsMap?.get(skill)?.length}
                </span>
              )}
            </span>
          ))}
          {uniqueSkills.length > 4 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              +{uniqueSkills.length - 4}
            </span>
          )}
        </div>
      </div>
      
      {/* Card Body - Shows when expanded */}
      {expanded && (
        <div className="p-4 border-b border-gray-100 animate-fade-in">
          {/* Contact Information */}
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Information</h4>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Mail size={14} className="mr-2 text-gray-400" />
                <span className="text-gray-800">{candidate.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone size={14} className="mr-2 text-gray-400" />
                <span className="text-gray-800">{candidate.phone || 'Not provided'}</span>
              </div>
              {candidate.github_url && (
                <div className="flex items-center text-sm">
                  <GitHub size={14} className="mr-2 text-gray-400" />
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    GitHub Profile
                  </a>
                </div>
              )}
              {candidate.linkedin_url && (
                <div className="flex items-center text-sm">
                  <Linkedin size={14} className="mr-2 text-gray-400" />
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Work Experience */}
          {candidate.work_experience && candidate.work_experience.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Work Experience</h4>
              <div className="space-y-3">
                {candidate.work_experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex justify-between">
                      <h5 className="font-medium text-sm text-gray-800">{exp.title}</h5>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{exp.company}</p>
                    {exp.location && <p className="text-xs text-gray-500 mb-1">{exp.location}</p>}
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="text-xs text-gray-700 list-disc list-inside space-y-1 mt-1">
                        {exp.responsibilities.slice(0, 2).map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                        {exp.responsibilities.length > 2 && (
                          <li className="text-primary-600">+{exp.responsibilities.length - 2} more responsibilities</li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Projects */}
          {candidate.projects && candidate.projects.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Projects</h4>
              <div className="space-y-3">
                {candidate.projects.map((project, index) => (
                  <div key={index} className="border border-gray-100 rounded-md p-2">
                    <h5 className="font-medium text-sm text-gray-800">{project.name}</h5>
                    <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                    {project.skills && project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.skills.map((tech, idx) => (
                          <span 
                            key={idx} 
                            className="px-1.5 py-0.5 rounded text-xs bg-secondary-50 text-secondary-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Card Footer */}
      <div className="p-3 flex justify-end items-center bg-gray-50">
        <button
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} className="mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} className="mr-1" />
              Show More
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;