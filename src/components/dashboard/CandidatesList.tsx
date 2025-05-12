import React from 'react';
import { Candidate, SortOption, LocationCoordinates, GroupedSkillsMap } from '../../types';
import CandidateCard from './CandidateCard';
import { FileDown, Users, SortAsc, SortDesc, Locate, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportCandidateData } from '../../utils/filterUtils';

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface CandidatesListProps {
  candidates: Candidate[];
  totalCandidates: number;
  sortOption: SortOption;
  onSortChange: (sortOption: SortOption) => void;
  userLocation?: LocationCoordinates;
  onUserLocationChange: (location: LocationCoordinates | undefined) => void;
  groupedSkillsMap?: GroupedSkillsMap;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  totalCandidates,
  sortOption,
  onSortChange,
  userLocation,
  onUserLocationChange,
  groupedSkillsMap,
  pagination,
  onPageChange
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

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      onPageChange(pagination.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      onPageChange(pagination.currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    
    // Add page numbers around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Add last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
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

  const renderPagination = () => {
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) return null;
    
    const pageNumbers = getPageNumbers();
    
    return (
      <div className="flex items-center justify-center mt-8 space-x-1">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>
        
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Users size={20} className="mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">
            Candidates <span className="text-gray-500">({totalCandidates})</span>
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
        <>
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
          
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default CandidatesList;