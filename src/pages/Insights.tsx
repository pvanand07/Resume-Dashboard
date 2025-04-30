import React, { useState, useEffect, Suspense } from 'react';
import { Candidate } from '../types';
import Layout from '../components/layout/Layout';
import { InsightsSummary, InsightsCharts, LocationHeatmap } from '../components/insights';
import { fetchCandidatesData } from '../data/candidatesData';
import { Loader2, BarChart3, Map, ChevronDown, Info } from 'lucide-react';

const Insights: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    geography: true,
    skills: true
  });
  
  // Fetch candidates data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCandidatesData();
        setCandidates(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading candidates data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4" />
            <p className="text-lg text-gray-600">Loading insights data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Analytics</h1>
          <p className="text-gray-500">Comprehensive insights about your candidate pool</p>
        </header>

        {/* Summary Section */}
        <section className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('summary')}
          >
            <div className="flex items-center">
              <BarChart3 size={20} className="mr-2 text-primary-500" />
              <h2 className="text-lg font-medium text-gray-900">
                Candidate Pool Summary
              </h2>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-500 transition-transform ${expandedSections.summary ? 'rotate-180' : ''}`}
            />
          </div>
          
          {expandedSections.summary && <InsightsSummary candidates={candidates} />}
        </section>
        
        {/* Geographic Distribution Section */}
        <section className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('geography')}
          >
            <div className="flex items-center">
              <Map size={20} className="mr-2 text-accent-500" />
              <h2 className="text-lg font-medium text-gray-900">
                Geographic Distribution
              </h2>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-500 transition-transform ${expandedSections.geography ? 'rotate-180' : ''}`}
            />
          </div>
          
          {expandedSections.geography && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <Suspense fallback={
                <div className="flex items-center justify-center h-[500px] bg-gray-50">
                  <div className="text-center">
                    <Map size={30} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400">Loading map...</p>
                  </div>
                </div>
              }>
                <LocationHeatmap candidates={candidates} />
              </Suspense>
            </div>
          )}
        </section>
        
        {/* Skills & Experience Section */}
        <section className="mb-8">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('skills')}
          >
            <div className="flex items-center">
              <BarChart3 size={20} className="mr-2 text-secondary-500" />
              <h2 className="text-lg font-medium text-gray-900">
                Skills & Experience Analysis
              </h2>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full mr-2">
                {candidates.length} candidates
              </span>
              <ChevronDown 
                size={20} 
                className={`text-gray-500 transition-transform ${expandedSections.skills ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          
          {expandedSections.skills && <InsightsCharts candidates={candidates} />}
        </section>
        
        {/* Legend/Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start">
          <Info size={18} className="text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="mb-2">This dashboard displays aggregated candidate data to help you understand your talent pool.</p>
            <p>Charts and visualizations are interactive - hover over elements to see detailed information.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Insights;