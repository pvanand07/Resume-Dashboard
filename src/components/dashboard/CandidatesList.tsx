import React from 'react';
import { Candidate, SortOption, LocationCoordinates, GroupedSkillsMap } from '../../types';
import CandidateCard from './CandidateCard';
import { FileDown, Users, SortAsc, SortDesc, Locate, Star, Clock } from 'lucide-react';
import { exportCandidateData } from '../../utils/filterUtils';

interface CandidatesListProps {
  candidates: Candidate[];
  sortOption: SortOption;
  onSortChange: (sortOption: SortOption) => void;
  userLocation?: LocationCoordinates;
  onUserLocationChange: (location: LocationCoordinates | undefined) => void;
  groupedSkillsMap?: GroupedSkillsMap;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  sortOption,
  onSortChange,
  userLocation,
  onUserLocationChange,
  groupedSkillsMap
}) => {
  const handleExport = () => {
    exportCandidateData(candidates);
  };

  const handleSort = (field: SortOption['field']) => {
    if (field === sortOption.field) {
      // Toggle direction if the same field is clicked
      onSortChange({
        field,
        direction: sortOption.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new field with appropriate default direction
      const defaultDirection = field === 'distance' ? 'asc' : 'desc';
      onSortChange({
        field,
        direction: defaultDirection
      });
    }
  };

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          onUserLocationChange(newLocation);
          // Automatically sort by distance when location is obtained
          onSortChange({
            field: 'distance',
            direction: 'asc'
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          alert('Unable to get your location. Please enable location services in your browser.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Function to render sort button with appropriate icon
  const renderSortButton = (field: SortOption['field'], label: string, icon: React.ReactNode) => {
    const isActive = sortOption.field === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-primary-50 border-primary-300 text-primary-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {icon}
        <span className="ml-1">{label}</span>
        {isActive && (
          <span className="ml-1">
            {sortOption.direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Users size={20} className="mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">
            Candidates <span className="text-gray-500">({candidates.length})</span>
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="flex items-center px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            onClick={handleGetUserLocation}
            title="Use your location to sort candidates by distance"
          >
            <Locate size={16} className="mr-1" />
            {userLocation ? 'Location Set' : 'Use My Location'}
          </button>
          
          <div className="flex space-x-1">
            {renderSortButton('score', 'Score', <Star size={16} className="mr-1" />)}
            {renderSortButton('distance', 'Distance', <Locate size={16} className="mr-1" />)}
            {renderSortButton('experience', 'Experience', <Clock size={16} className="mr-1" />)}
          </div>
          
          <button
            className="flex items-center px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            onClick={handleExport}
          >
            <FileDown size={16} className="mr-1" />
            Export All
          </button>
        </div>
      </div>
      
      {candidates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-2">No candidates match your filters.</p>
          <p className="text-sm text-gray-400">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              userLocation={userLocation}
              groupedSkillsMap={groupedSkillsMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidatesList;