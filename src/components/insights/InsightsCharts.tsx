import React from 'react';
import { Candidate } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  prepareExperienceDistribution, 
  prepareSkillsDistribution,
  calculateScoreDistribution
} from '../../utils/visualizationUtils';

interface InsightsChartsProps {
  candidates: Candidate[];
}

const InsightsCharts: React.FC<InsightsChartsProps> = ({ candidates }) => {
  const experienceData = prepareExperienceDistribution(candidates);
  const skillsData = prepareSkillsDistribution(candidates);
  const scoreData = calculateScoreDistribution(candidates);
  
  const COLORS = {
    experience: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
    skills: ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
    score: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c']
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md border border-gray-200 rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary-600">
            {`${payload[0].value} candidates`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Experience & Skills Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Experience Distribution Chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <h3 className="text-base font-medium text-gray-800 mb-2">Experience Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Breakdown of candidates by years of experience</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={experienceData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }} 
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]}
                barSize={24}
              >
                {experienceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.experience[index % COLORS.experience.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Skills Distribution Chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <h3 className="text-base font-medium text-gray-800 mb-2">Top Skills Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Most frequent skills in the candidate pool</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={skillsData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }} 
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]}
                barSize={24}
              >
                {skillsData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.skills[index % COLORS.skills.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Score Distribution Chart - Full Width */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-1">Candidate Score Distribution</h3>
            <p className="text-xs text-gray-500">Number of candidates by score range</p>
          </div>
          <div className="mt-2 md:mt-0 flex">
            {['0-20', '21-40', '41-60', '61-80', '81-100'].map((range, i) => (
              <div key={i} className="flex items-center mr-3">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: COLORS.score[i % COLORS.score.length] }}
                ></div>
                <span className="text-xs text-gray-600">{range}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart 
            data={scoreData}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              barSize={50}
            >
              {scoreData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS.score[index % COLORS.score.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InsightsCharts;