import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Candidate } from '../../types';
import CandidateDetails from '../../pages/CandidateDetails';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const CandidateModal: React.FC<CandidateModalProps> = ({ 
  isOpen, 
  onClose, 
  candidate 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // Escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 animate-fade-in">
      <div 
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-auto"
      >
        {/* Close button positioned in the top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label="Close details"
        >
          <X size={18} />
        </button>
        
        {candidate ? (
          <div className="p-2 pt-6 sm:p-4">
            <div className="candidate-details-content">
              <CandidateDetails candidateData={candidate} isModal={true} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No candidate data available
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateModal; 