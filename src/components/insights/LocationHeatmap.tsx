import React, { useEffect, useRef, useState } from 'react';
import { Candidate } from '../../types';
import { MapPin, X, Users, ExternalLink, ZoomIn, ZoomOut, Info } from 'lucide-react';
import CandidateCard from '../dashboard/CandidateCard';

interface LocationHeatmapProps {
  candidates: Candidate[];
}

declare global {
  interface Window {
    L: any;
  }
}

const LocationHeatmap: React.FC<LocationHeatmapProps> = ({ candidates }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatLayer = useRef<any>(null);
  const markerClusterGroup = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [mapInfo, setMapInfo] = useState({ 
    totalMapped: 0,
    isLoaded: false 
  });

  // Helper function to determine marker color based on location density
  const getMarkerColor = (lat: number, lng: number, candidates: Candidate[]) => {
    // Count number of candidates in close proximity
    const proximityThreshold = 0.05; // ~5km
    const nearbyCount = candidates.filter(c => 
      c.location_coordinates && 
      Math.abs(c.location_coordinates.lat - lat) < proximityThreshold && 
      Math.abs(c.location_coordinates.lng - lng) < proximityThreshold
    ).length;
    
    if (nearbyCount > 20) return "#EF4444"; // red-500 - High density
    if (nearbyCount > 5) return "#65A30D";  // lime-600 - Medium density
    return "#3B82F6";                       // blue-500 - Low density
  };

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if map is already initialized - if yes, cleanup first
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Initialize map
    mapInstance.current = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([20.5937, 78.9629], 5); // Center on India

    // Add custom zoom controls
    const zoomControl = window.L.control({ position: 'topright' });
    zoomControl.onAdd = function() {
      const div = window.L.DomUtil.create('div', 'leaflet-control-zoom custom-zoom-control');
      div.innerHTML = `
        <button id="zoom-in" class="p-2 bg-white rounded-t-md border border-gray-300 hover:bg-gray-100 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <button id="zoom-out" class="p-2 bg-white rounded-b-md border border-b-gray-300 border-l-gray-300 border-r-gray-300 hover:bg-gray-100 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      `;
      
      div.querySelector('#zoom-in')?.addEventListener('click', () => {
        mapInstance.current.zoomIn();
      });
      
      div.querySelector('#zoom-out')?.addEventListener('click', () => {
        mapInstance.current.zoomOut();
      });
      
      return div;
    };
    zoomControl.addTo(mapInstance.current);

    // Add attribution control in a custom position/style
    const attributionControl = window.L.control.attribution({
      position: 'bottomright',
      prefix: ''
    }).addTo(mapInstance.current);
    attributionControl.setPrefix('');
    attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(mapInstance.current);

    // Prepare heatmap data with proper validation
    const heatData = candidates
      .filter(candidate => 
        !candidate.error &&
        candidate.location_coordinates && 
        typeof candidate.location_coordinates.lat === 'number' && 
        typeof candidate.location_coordinates.lng === 'number' &&
        !isNaN(candidate.location_coordinates.lat) &&
        !isNaN(candidate.location_coordinates.lng)
      )
      .map(candidate => [
        candidate.location_coordinates.lat,
        candidate.location_coordinates.lng,
        1 // intensity
      ]);

    const validCandidatesCount = heatData.length;
    setMapInfo({
      totalMapped: validCandidatesCount,
      isLoaded: true
    });
    
    if (heatData.length > 0) {
      // Add heatmap layer with reduced opacity for better marker visibility
      heatLayer.current = window.L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' },
        maxOpacity: 0.7
      }).addTo(mapInstance.current);
    }

    // Create a marker cluster group
    markerClusterGroup.current = window.L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        let className = 'bg-blue-500';
        
        if (count > 50) {
          size = 'large';
          className = 'bg-red-500';
        } else if (count > 10) {
          size = 'medium';
          className = 'bg-lime-500';
        }
        
        return window.L.divIcon({
          html: `<div class="cluster-marker ${className} ${size}">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: window.L.point(40, 40)
        });
      }
    });
    
    mapInstance.current.addLayer(markerClusterGroup.current);

    // Add markers with popups
    markers.current = candidates
      .filter(candidate => 
        !candidate.error &&
        candidate.location_coordinates && 
        typeof candidate.location_coordinates.lat === 'number' && 
        typeof candidate.location_coordinates.lng === 'number' &&
        !isNaN(candidate.location_coordinates.lat) &&
        !isNaN(candidate.location_coordinates.lng)
      )
      .map(candidate => {
        const lat = candidate.location_coordinates.lat;
        const lng = candidate.location_coordinates.lng;
        const markerColor = getMarkerColor(lat, lng, candidates);
        
        const marker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            html: `<div class="map-marker">
              <div class="marker-pin" style="background-color: ${markerColor}">
                <div class="marker-dot"></div>
              </div>
            </div>`,
            className: 'custom-div-icon',
            iconSize: [18, 24],
            iconAnchor: [9, 24]
          })
        });

        const popupContent = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-medium text-gray-900 mb-1">${candidate.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${candidate.location || 'Location not specified'}</p>
            <div class="space-y-2 mt-2">
              <div class="flex items-center text-xs">
                <span class="font-medium mr-2">Experience:</span>
                <span>${candidate.total_we_months || 0} months</span>
              </div>
              <div class="flex items-center text-xs">
                <span class="font-medium mr-2">Status:</span>
                <span>${candidate.computed?.employment_status || 'Unknown'}</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-gray-200">
              <button 
                class="text-xs flex items-center text-primary-600 hover:text-primary-800 view-profile-btn"
                data-candidate-id="${candidate.id}"
              >
                View Full Profile
                <svg class="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: true,
          maxWidth: 300
        });

        // Add click handler for the View Profile button
        marker.on('popupopen', () => {
          const btn = document.querySelector('.view-profile-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              setSelectedCandidate(candidate);
              marker.closePopup();
            });
          }
        });
        
        marker.addTo(markerClusterGroup.current);
        return marker;
      });

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      if (markerClusterGroup.current) {
        markerClusterGroup.current = null;
      }
    };
  }, [candidates]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
      {mapInfo.isLoaded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center">
            <MapPin size={16} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-medium text-gray-800">
              Candidate Locations
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-indigo-100 px-2 py-1 rounded-full">
              <Users size={14} className="text-indigo-700" />
              <span className="text-xs font-medium text-indigo-700">
                {mapInfo.totalMapped} mapped
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <span>Click markers to view details</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        <div ref={mapRef} className="h-[500px] flex-1 relative shadow-inner">
          {!mapInfo.isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-pulse flex flex-col items-center">
                <MapPin size={30} className="text-gray-300 mb-2" />
                <p className="text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Details Panel */}
        {selectedCandidate && (
          <div className="w-[500px] border-l border-gray-200 overflow-y-auto max-h-[500px] relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Candidate Profile</h3>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <CandidateCard candidate={selectedCandidate} />
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Info size={14} className="text-gray-400 mr-2" />
          <span className="text-xs text-gray-500">
            Darker areas indicate higher concentration of candidates
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-500">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-lime-500"></div>
            <span className="text-xs text-gray-500">Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationHeatmap; 