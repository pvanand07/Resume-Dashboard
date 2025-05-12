import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, User, MapPin, Phone, Mail, Calendar, Github, Linkedin, FileText, ExternalLink, ClipboardCheck, Award, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Candidate, WorkExperience, Project } from '../types';

interface CandidateDetailsProps {
  candidateData?: Candidate;
  isModal?: boolean;
}

const CandidateDetails: React.FC<CandidateDetailsProps> = ({ candidateData, isModal = false }) => {
  const { hashPrefix } = useParams<{ hashPrefix: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(candidateData || null);
  const [loading, setLoading] = useState(!candidateData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If candidateData is provided directly, use it
    if (candidateData) {
      setCandidate(candidateData);
      setLoading(false);
      return;
    }

    // Otherwise fetch data based on URL parameter
    const fetchCandidateData = async () => {
      try {
        const response = await fetch(`https://resume-parser-api.elevatics.site/results/${hashPrefix}`);
        if (!response.ok) {
          throw new Error('Failed to fetch candidate data');
        }
        
        const data = await response.json();
        setCandidate(data);
      } catch (err) {
        setError('Error loading candidate data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (hashPrefix) {
      fetchCandidateData();
    }
  }, [hashPrefix, candidateData]);

  if (loading) {
    return (
      <div className={isModal ? "p-8" : "min-h-screen bg-gray-50 flex items-center justify-center"}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Loading candidate data...</h1>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className={isModal ? "p-8" : "min-h-screen bg-gray-50 p-4 md:p-8"}>
        <div className="max-w-5xl mx-auto">
          {!isModal && (
            <Link to="/upload" className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition">
              <ArrowLeft size={20} className="mr-2" />
              Back to Resume Upload
            </Link>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Candidate</h2>
            <p className="text-gray-600 mb-6">{error || 'Could not find candidate data'}</p>
            {!isModal && (
              <Link 
                to="/upload" 
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
              >
                Return to Upload Page
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  const calculateTotalExperience = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  // If rendered in a modal, use a simplified version without the full page layout
  if (isModal) {
    return (
      <div className="candidate-details-modal mt-0">
        {/* Candidate Name and Score Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
            {candidate.computed?.score !== undefined && (
              <div className="bg-primary-50 rounded-full h-12 w-12 flex items-center justify-center ml-2 mr-4">
                <span className="text-lg font-bold text-primary-600">{Math.round(candidate.computed.score)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {candidate.computed?.experience_level && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {candidate.computed.experience_level}
              </span>
            )}
            {candidate.computed?.employment_status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {candidate.computed.employment_status}
              </span>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                  <a 
                    href={`mailto:${candidate.email}`} 
                    className="text-gray-700 hover:text-primary-600 text-sm truncate"
                  >
                    {candidate.email}
                  </a>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center">
                    <Phone className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <a 
                      href={`tel:${candidate.phone}`} 
                      className="text-gray-700 hover:text-primary-600 text-sm"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center">
                    <MapPin className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <span className="text-gray-700 text-sm">{candidate.location}</span>
                  </div>
                )}
                
                {candidate.total_we_months > 0 && (
                  <div className="flex items-center">
                    <Clock className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <span className="text-gray-700 text-sm">
                      {calculateTotalExperience(candidate.total_we_months)} of experience
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Links Card */}
            {(candidate.github_url || candidate.linkedin_url) && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Links</h3>
                <div className="space-y-3">
                  {candidate.github_url && (
                    <div className="flex items-center">
                      <Github className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                      <a 
                        href={candidate.github_url.startsWith('http') ? candidate.github_url : `https://${candidate.github_url}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-primary-600 text-sm flex items-center"
                      >
                        GitHub
                        <ExternalLink size={14} className="ml-1 inline-block" />
                      </a>
                    </div>
                  )}
                  
                  {candidate.linkedin_url && (
                    <div className="flex items-center">
                      <Linkedin className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                      <a 
                        href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-primary-600 text-sm flex items-center"
                      >
                        LinkedIn
                        <ExternalLink size={14} className="ml-1 inline-block" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Technical Skills */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {/* Collecting unique skills from work experience and projects */}
                {Array.from(new Set([
                  ...(candidate.work_experience || []).flatMap(we => we.skills || []),
                  ...(candidate.projects || []).flatMap(project => project.skills || [])
                ])).map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Experience & Projects */}
          <div className="lg:col-span-2 space-y-4">
            {/* Work Experience */}
            {candidate.work_experience && candidate.work_experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase size={18} className="mr-2 text-primary-500" />
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {candidate.work_experience.map((experience: WorkExperience, index: number) => (
                    <div key={index} className="relative pl-6 border-l-2 border-gray-200 pb-2">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary-500" />
                      <div className="mb-1 flex flex-wrap justify-between items-start">
                        <h4 className="text-base font-medium text-gray-900">{experience.title}</h4>
                        <div className="text-sm font-medium text-gray-600 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(experience.start_date)} — {experience.is_current ? 'Present' : formatDate(experience.end_date)}
                        </div>
                      </div>
                      <div className="mb-3 flex items-center">
                        <span className="text-gray-700 font-medium">{experience.company}</span>
                        {experience.location && (
                          <span className="text-gray-500 text-sm ml-3 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {experience.location}
                          </span>
                        )}
                      </div>
                      {experience.responsibilities && experience.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-3">
                          {experience.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                      )}
                      {experience.skills && experience.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {experience.skills.map((skill, skillIdx) => (
                            <span key={skillIdx} className="bg-gray-100 text-xs text-gray-700 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Projects */}
            {candidate.projects && candidate.projects.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <Award size={18} className="mr-2 text-primary-500" />
                  Projects
                </h3>
                <div className="space-y-6">
                  {candidate.projects.map((project: Project, index: number) => (
                    <div key={index} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-medium text-gray-900">{project.name}</h4>
                        {project.url && (
                          <a 
                            href={project.url.startsWith('http') ? project.url : `https://${project.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                          >
                            View Project <ExternalLink size={14} className="ml-1" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{project.description}</p>
                      {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.skills.map((skill, skillIdx) => (
                            <span key={skillIdx} className="bg-gray-100 text-xs text-gray-700 px-2 py-0.5 rounded">
                              {skill}
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link to="/upload" className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Resume Upload
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Profile</h1>
          <p className="text-gray-600 mt-2">Parsed resume data for {candidate.name}</p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                  {candidate.computed?.experience_level && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      {candidate.computed.experience_level}
                    </span>
                  )}
                  {candidate.computed?.employment_status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2 ml-2">
                      {candidate.computed.employment_status}
                    </span>
                  )}
                </div>
                {candidate.computed?.score !== undefined && (
                  <div className="bg-primary-50 rounded-full h-14 w-14 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">{Math.round(candidate.computed.score)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                  <a 
                    href={`mailto:${candidate.email}`} 
                    className="text-gray-700 hover:text-primary-600 text-sm truncate"
                  >
                    {candidate.email}
                  </a>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center">
                    <Phone className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <a 
                      href={`tel:${candidate.phone}`} 
                      className="text-gray-700 hover:text-primary-600 text-sm"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center">
                    <MapPin className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <span className="text-gray-700 text-sm">{candidate.location}</span>
                  </div>
                )}
                
                {candidate.total_we_months > 0 && (
                  <div className="flex items-center">
                    <Clock className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                    <span className="text-gray-700 text-sm">
                      {calculateTotalExperience(candidate.total_we_months)} of experience
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Links Card */}
            {(candidate.github_url || candidate.linkedin_url) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
                <div className="space-y-3">
                  {candidate.github_url && (
                    <div className="flex items-center">
                      <Github className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                      <a 
                        href={candidate.github_url.startsWith('http') ? candidate.github_url : `https://${candidate.github_url}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-primary-600 text-sm flex items-center"
                      >
                        GitHub
                        <ExternalLink size={14} className="ml-1 inline-block" />
                      </a>
                    </div>
                  )}
                  
                  {candidate.linkedin_url && (
                    <div className="flex items-center">
                      <Linkedin className="text-gray-500 mr-3 flex-shrink-0" size={18} />
                      <a 
                        href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-primary-600 text-sm flex items-center"
                      >
                        LinkedIn
                        <ExternalLink size={14} className="ml-1 inline-block" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Technical Skills */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {/* Collecting unique skills from work experience and projects */}
                {Array.from(new Set([
                  ...(candidate.work_experience || []).flatMap(we => we.skills || []),
                  ...(candidate.projects || []).flatMap(project => project.skills || [])
                ])).map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Experience & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Experience */}
            {candidate.work_experience && candidate.work_experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Briefcase size={20} className="mr-2 text-primary-500" />
                  Work Experience
                </h3>
                <div className="space-y-8">
                  {candidate.work_experience.map((experience: WorkExperience, index: number) => (
                    <div key={index} className="relative pl-6 border-l-2 border-gray-200 pb-2">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary-500" />
                      <div className="mb-1 flex flex-wrap justify-between items-start">
                        <h4 className="text-lg font-medium text-gray-900">{experience.title}</h4>
                        <div className="text-sm font-medium text-gray-600 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(experience.start_date)} — {experience.is_current ? 'Present' : formatDate(experience.end_date)}
                        </div>
                      </div>
                      <div className="mb-3 flex items-center">
                        <span className="text-gray-700 font-medium">{experience.company}</span>
                        {experience.location && (
                          <span className="text-gray-500 text-sm ml-3 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {experience.location}
                          </span>
                        )}
                      </div>
                      {experience.responsibilities && experience.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-3">
                          {experience.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                      )}
                      {experience.skills && experience.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {experience.skills.map((skill, skillIdx) => (
                            <span key={skillIdx} className="bg-gray-100 text-xs text-gray-700 px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Projects */}
            {candidate.projects && candidate.projects.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Award size={20} className="mr-2 text-primary-500" />
                  Projects
                </h3>
                <div className="space-y-6">
                  {candidate.projects.map((project: Project, index: number) => (
                    <div key={index} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                        {project.url && (
                          <a 
                            href={project.url.startsWith('http') ? project.url : `https://${project.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                          >
                            View Project <ExternalLink size={14} className="ml-1" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{project.description}</p>
                      {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.skills.map((skill, skillIdx) => (
                            <span key={skillIdx} className="bg-gray-100 text-xs text-gray-700 px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File Information */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center text-sm text-gray-500">
                <FileText size={16} className="mr-2" />
                <span>Source: {candidate.source_file} (ID: {candidate.file_hash})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails; 