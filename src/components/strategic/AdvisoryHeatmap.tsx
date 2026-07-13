import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface AdvisoryHeatmapProps {
  map: mapboxgl.Map | null;
  advisories: any[];
  category: string;
  enabled: boolean;
}

const AdvisoryHeatmap = ({ map, advisories, category, enabled }: AdvisoryHeatmapProps) => {
  useEffect(() => {
    if (!map || !enabled) {
      // Remove heatmap layer if disabled
      if (map && map.getLayer('advisories-heatmap')) {
        map.removeLayer('advisories-heatmap');
      }
      if (map && map.getSource('advisories-heatmap')) {
        map.removeSource('advisories-heatmap');
      }
      return;
    }

    // Filter advisories by category if specified
    const filteredAdvisories = category === "all" 
      ? advisories 
      : advisories.filter(a => a.category === category);

    // Create GeoJSON features
    const features = filteredAdvisories
      .filter(a => a.location_lat && a.location_lon)
      .map(advisory => ({
        type: 'Feature' as const,
        properties: {
          severity: advisory.severity
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [advisory.location_lon, advisory.location_lat]
        }
      }));

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    };

    // Remove existing heatmap if present
    if (map.getLayer('advisories-heatmap')) {
      map.removeLayer('advisories-heatmap');
    }
    if (map.getSource('advisories-heatmap')) {
      map.removeSource('advisories-heatmap');
    }

    // Add heatmap source and layer
    map.addSource('advisories-heatmap', {
      type: 'geojson',
      data: geojson
    });

    map.addLayer({
      id: 'advisories-heatmap',
      type: 'heatmap',
      source: 'advisories-heatmap',
      paint: {
        // Increase weight for critical incidents
        'heatmap-weight': [
          'match',
          ['get', 'severity'],
          'CRITICAL', 3,
          'CAUTION', 2,
          'NORMAL', 1,
          1
        ],
        // Increase intensity as zoom level increases
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Color ramp for heatmap
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Adjust radius by zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0
        ]
      }
    });

    return () => {
      if (map.getLayer('advisories-heatmap')) {
        map.removeLayer('advisories-heatmap');
      }
      if (map.getSource('advisories-heatmap')) {
        map.removeSource('advisories-heatmap');
      }
    };
  }, [map, advisories, category, enabled]);

  return null;
};

export default AdvisoryHeatmap;