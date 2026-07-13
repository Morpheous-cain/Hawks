/**
 * Geofence Validation Utility
 * Validates if a guard's GPS coordinates are within a client's geofence radius
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeofenceConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

/**
 * Calculate the distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if coordinates are within a geofence
 */
export const isWithinGeofence = (
  userCoords: Coordinates,
  geofence: GeofenceConfig
): { isValid: boolean; distance: number; message: string } => {
  const distance = calculateDistance(userCoords, {
    lat: geofence.centerLat,
    lng: geofence.centerLng,
  });

  const isValid = distance <= geofence.radiusMeters;

  return {
    isValid,
    distance: Math.round(distance),
    message: isValid
      ? `Within geofence (${Math.round(distance)}m from center)`
      : `Outside geofence by ${Math.round(distance - geofence.radiusMeters)}m`,
  };
};

/**
 * Get current GPS position with promise wrapper
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Validate guard location against client geofence
 */
export const validateGuardLocation = async (
  clientGeofence: GeofenceConfig | null
): Promise<{
  isValid: boolean;
  coords: Coordinates | null;
  accuracy: number | null;
  distance: number | null;
  message: string;
}> => {
  // If no geofence configured, allow scan
  if (!clientGeofence || !clientGeofence.centerLat || !clientGeofence.centerLng) {
    return {
      isValid: true,
      coords: null,
      accuracy: null,
      distance: null,
      message: 'No geofence configured - scan allowed',
    };
  }

  try {
    const position = await getCurrentPosition();
    const userCoords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    const validation = isWithinGeofence(userCoords, clientGeofence);

    return {
      isValid: validation.isValid,
      coords: userCoords,
      accuracy: Math.round(position.coords.accuracy),
      distance: validation.distance,
      message: validation.message,
    };
  } catch (error: any) {
    return {
      isValid: false,
      coords: null,
      accuracy: null,
      distance: null,
      message: `GPS error: ${error.message || 'Unable to get location'}`,
    };
  }
};
