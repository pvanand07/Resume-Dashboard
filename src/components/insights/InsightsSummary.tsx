import React from 'react';
import { Candidate } from '../../types';
import { Users, Briefcase, Map, Award, Brain, TrendingUp, Calendar } from 'lucide-react';
import { MapPin } from 'lucide-react';

interface InsightsSummaryProps {
  candidates: Candidate[];
}

const InsightsSummary: React.FC<InsightsSummaryProps> = ({ candidates }) => {
  // Calculate summary statistics
  const totalCandidates = candidates.length;
  
  const calculateAverageExperience = () => {
    if (totalCandidates === 0) return 0;
    const totalMonths = candidates.reduce((sum, candidate) => {
      return sum + (candidate.total_we_months || 0);
    }, 0);
    return (totalMonths / totalCandidates).toFixed(1);
  };
  
  const calculateTopSkills = () => {
    const skillCount: Record<string, number> = {};
    
    if (candidates && Array.isArray(candidates)) {
      candidates.forEach(candidate => {
        // Get skills from work experience
        if (candidate.work_experience && Array.isArray(candidate.work_experience)) {
          candidate.work_experience.forEach(exp => {
            if (exp && exp.skills && Array.isArray(exp.skills)) {
              exp.skills.forEach(skill => {
                if (skill) {
                  skillCount[skill] = (skillCount[skill] || 0) + 1;
                }
              });
            }
          });
        }
        
        // Get skills from projects
        if (candidate.projects && Array.isArray(candidate.projects)) {
          candidate.projects.forEach(proj => {
            if (proj && proj.skills && Array.isArray(proj.skills)) {
              proj.skills.forEach(skill => {
                if (skill) {
                  skillCount[skill] = (skillCount[skill] || 0) + 1;
                }
              });
            }
          });
        }
      });
    }
    
    // Sort skills by count
    const sortedSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Get the maximum count for normalization
    const maxCount = sortedSkills.length > 0 ? sortedSkills[0][1] : 0;
    
    // Map to final format with normalized percentages (relative to highest)
    return sortedSkills.map(([skill, count]) => ({ 
      skill, 
      count,
      percentage: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
    }));
  };
  
  const calculateLocationDistribution = () => {
    const locationCount: Record<string, number> = {};
    
    if (candidates && Array.isArray(candidates)) {
      candidates.forEach(candidate => {
        const location = candidate.location || 'Unknown';
        locationCount[location] = (locationCount[location] || 0) + 1;
      });
    }
    
    return Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / totalCandidates) * 100)
      }));
  };
  
  const calculateEmploymentStatus = () => {
    const statusCount = {
      Employed: 0,
      Unemployed: 0
    };
    
    if (candidates && Array.isArray(candidates)) {
      candidates.forEach(candidate => {
        const status = candidate.computed?.employment_status || 'Unemployed';
        statusCount[status as keyof typeof statusCount] += 1;
      });
    }
    
    return {
      employed: {
        count: statusCount.Employed,
        percentage: Math.round((statusCount.Employed / totalCandidates) * 100)
      },
      unemployed: {
        count: statusCount.Unemployed,
        percentage: Math.round((statusCount.Unemployed / totalCandidates) * 100)
      }
    };
  };
  
  const averageExperience = calculateAverageExperience();
  const topSkills = calculateTopSkills();
  const topLocations = calculateLocationDistribution();
  const employmentStatus = calculateEmploymentStatus();

  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Candidates</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalCandidates}</h3>
            </div>
            <div className="p-2 rounded-full bg-primary-50">
              <Users size={20} className="text-primary-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar size={12} className="mr-1" />
              <span>Updated today</span>
            </div>
          </div>
        </div>
        
        {/* Average Experience */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg. Experience</p>
              <h3 className="text-2xl font-bold text-gray-900">{averageExperience} <span className="text-sm font-normal">months</span></h3>
            </div>
            <div className="p-2 rounded-full bg-secondary-50">
              <Briefcase size={20} className="text-secondary-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <TrendingUp size={12} className="mr-1" />
              <span>{parseFloat(averageExperience) > 12 ? 'Senior level average' : 'Junior level average'}</span>
            </div>
          </div>
        </div>
        
        {/* Top Location */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Top Location</p>
              <h3 className="text-2xl font-bold text-gray-900 truncate max-w-[180px]">
                {topLocations.length > 0 ? topLocations[0].location : 'N/A'}
              </h3>
            </div>
            <div className="p-2 rounded-full bg-accent-50">
              <Map size={20} className="text-accent-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Users size={12} className="mr-1" />
              {topLocations.length > 0 ? (
                <span>{topLocations[0].count} candidates ({topLocations[0].percentage}%)</span>
              ) : (
                <span>No location data</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Employment Status */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 transition hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Currently Employed</p>
              <h3 className="text-2xl font-bold text-gray-900">{employmentStatus.employed.percentage}%</h3>
            </div>
            <div className="p-2 rounded-full bg-gray-100">
              <Award size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between w-full">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${employmentStatus.employed.percentage}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                {employmentStatus.employed.count}/{totalCandidates}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 flex items-center">
              <Brain size={16} className="mr-2 text-primary-500" />
              Top Skills
            </h3>
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
              {topSkills.length} unique skills
            </span>
          </div>
          
          <div className="space-y-3">
            {topSkills.map((skill, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">{skill.skill}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {skill.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all group-hover:bg-primary-600"
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Location Distribution Brief */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 flex items-center">
              <Map size={16} className="mr-2 text-accent-500" />
              Top Locations
            </h3>
            <span className="text-xs bg-accent-50 text-accent-700 px-2 py-1 rounded-full">
              {topLocations.length} locations
            </span>
          </div>
          
          <div className="space-y-5">
            {topLocations.map((loc, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1 text-accent-500" />
                    <span className="font-medium text-gray-800 group-hover:text-accent-600 transition-colors">{loc.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={14} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{loc.count}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-500 rounded-full transition-all group-hover:bg-accent-600"
                    style={{ width: `${loc.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsSummary;