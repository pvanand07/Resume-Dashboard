import { Candidate } from '../types';

export const prepareExperienceDistribution = (candidates: Candidate[]) => {
  const experienceLevels = [
    'No Experience',
    'Less than 1 year',
    '1-3 years',
    '3-5 years',
    '5+ years'
  ];
  
  // Initialize counts
  const distribution = experienceLevels.map(level => ({
    name: level,
    count: 0
  }));
  
  // Count candidates in each experience level
  if (candidates && Array.isArray(candidates)) {
    candidates.forEach(candidate => {
      const level = candidate?.computed?.experience_level || 'No Experience';
      const index = experienceLevels.indexOf(level);
      if (index !== -1) {
        distribution[index].count += 1;
      }
    });
  }
  
  return distribution;
};

export const prepareSkillsDistribution = (candidates: Candidate[]) => {
  const skillsCount: Record<string, number> = {};
  
  console.log('Preparing skills distribution for', candidates?.length || 0, 'candidates');
  
  // Sample check of skills structure
  if (candidates && Array.isArray(candidates) && candidates.length > 0) {
    console.log('Sample candidate work experience:', candidates[0]?.work_experience);
    console.log('Sample candidate projects:', candidates[0]?.projects);
  }
  
  // Count occurrences of each skill
  if (candidates && Array.isArray(candidates)) {
    candidates.forEach(candidate => {
      // Count skills from work experience
      if (candidate?.work_experience && Array.isArray(candidate.work_experience)) {
        candidate.work_experience.forEach(exp => {
          if (exp?.skills) {
            console.log('Work experience skills:', exp.skills);
            exp.skills.forEach(skill => {
              if (skill) {
                skillsCount[skill] = (skillsCount[skill] || 0) + 1;
              }
            });
          }
        });
      }
      
      // Count skills from projects
      if (candidate?.projects && Array.isArray(candidate.projects)) {
        candidate.projects.forEach(proj => {
          if (proj?.skills) {
            console.log('Project skills:', proj.skills);
            proj.skills.forEach(skill => {
              if (skill) {
                skillsCount[skill] = (skillsCount[skill] || 0) + 1;
              }
            });
          }
        });
      }
    });
  }
  
  // Convert to array and sort by count
  const distribution = Object.entries(skillsCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 skills
  
  console.log('Final skills distribution:', distribution);
  
  return distribution;
};

export const calculateScoreDistribution = (candidates: Candidate[]) => {
  // Score ranges
  const ranges = [
    { name: '0-20', min: 0, max: 20 },
    { name: '21-40', min: 21, max: 40 },
    { name: '41-60', min: 41, max: 60 },
    { name: '61-80', min: 61, max: 80 },
    { name: '81-100', min: 81, max: 100 }
  ];
  
  // Initialize counts
  const distribution = ranges.map(range => ({
    name: range.name,
    count: 0
  }));
  
  // Count candidates in each score range
  if (candidates && Array.isArray(candidates)) {
    candidates.forEach(candidate => {
      const score = candidate?.computed?.score || 0;
      
      for (let i = 0; i < ranges.length; i++) {
        if (score >= ranges[i].min && score <= ranges[i].max) {
          distribution[i].count += 1;
          break;
        }
      }
    });
  }
  
  return distribution;
};