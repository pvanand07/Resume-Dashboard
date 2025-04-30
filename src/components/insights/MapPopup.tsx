import React from 'react';
import { Candidate } from '../../types';
import CandidateCard from '../dashboard/CandidateCard';

interface MapPopupProps {
  candidate: Candidate;
}

const MapPopup: React.FC<MapPopupProps> = ({ candidate }) => {
  return (
    <div className="map-popup-content" style={{ minWidth: '400px', maxWidth: '600px' }}>
      <CandidateCard candidate={candidate} />
    </div>
  );
};

export default MapPopup; 