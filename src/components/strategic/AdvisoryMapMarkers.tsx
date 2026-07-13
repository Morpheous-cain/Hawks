import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface AdvisoryMapMarkersProps {
  map: mapboxgl.Map | null;
  advisories: any[];
  onMarkerClick: (advisory: any) => void;
}

const AdvisoryMapMarkers = ({ map, advisories, onMarkerClick }: AdvisoryMapMarkersProps) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    advisories.forEach(advisory => {
      if (!advisory.location_lat || !advisory.location_lon) return;

      const severityColor = {
        CRITICAL: '#ef4444',
        CAUTION: '#f59e0b',
        NORMAL: '#22c55e'
      }[advisory.severity] || '#6b7280';

      const el = document.createElement('div');
      el.className = 'advisory-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${severityColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      el.addEventListener('click', () => {
        onMarkerClick(advisory);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([advisory.location_lon, advisory.location_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${advisory.title}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${advisory.category} • ${advisory.severity}</p>
                <p style="font-size: 11px; color: #999;">Click marker for details</p>
              </div>
            `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, advisories, onMarkerClick]);

  return null;
};

export default AdvisoryMapMarkers;