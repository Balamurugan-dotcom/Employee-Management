import api from '../services/api';

// Calculate distance in meters between two geographical points using Haversine formula
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Request current GPS position from the browser/device
export const getDeviceCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your current browser or device.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Failed to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access permission was denied. Please enable GPS / location permissions in your browser to record attendance.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable on your device. Please ensure GPS is enabled.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location acquisition timed out. Please check your network and GPS signal.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  });
};

// Fetch authorized office location parameters from backend
export const fetchAuthorizedOfficeLocation = async () => {
  try {
    const res = await api.get(`/attendance/office-location?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (res.data?.success && res.data.officeLocation) {
      return {
        officeLocation: res.data.officeLocation,
        allowRemotePunch: Boolean(res.data.allowRemotePunch),
      };
    }
  } catch (err) {
    console.warn('Failed to fetch office location, using default office:', err);
  }
  return {
    officeLocation: {
      name: 'Main Office Headquarters',
      latitude: 12.9716,
      longitude: 77.5946,
      radiusMeters: 500,
      enforceLocation: true,
    },
    allowRemotePunch: false,
  };
};

/**
 * Verifies employee's current physical location against authorized office geofence.
 * Returns { success: boolean, message?: string, latitude?: number, longitude?: number, distance?: number, officeName?: string, officeLocation?: object }
 */
export const verifyAttendanceLocation = async () => {
  const { officeLocation, allowRemotePunch } = await fetchAuthorizedOfficeLocation();

  // If remote punch is explicitly enabled or location enforcement disabled
  if (allowRemotePunch || officeLocation?.enforceLocation === false) {
    try {
      const coords = await getDeviceCoordinates();
      return {
        success: true,
        latitude: coords.latitude,
        longitude: coords.longitude,
        distance: 0,
        officeName: officeLocation?.name || 'Remote Office',
        allowedRadius: officeLocation?.radiusMeters || 500,
        officeLocation,
        isBypassed: true,
      };
    } catch {
      return {
        success: true,
        latitude: null,
        longitude: null,
        distance: 0,
        officeName: officeLocation?.name || 'Remote Office',
        allowedRadius: officeLocation?.radiusMeters || 500,
        officeLocation,
        isBypassed: true,
      };
    }
  }

  // Strict GPS location verification
  let coords;
  try {
    coords = await getDeviceCoordinates();
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Location permission required to verify workplace attendance.',
      officeName: officeLocation?.name,
      officeLocation,
    };
  }

  const distance = calculateDistanceMeters(
    coords.latitude,
    coords.longitude,
    officeLocation.latitude,
    officeLocation.longitude
  );

  const allowedRadius = officeLocation.radiusMeters || 500;

  if (distance > allowedRadius) {
    return {
      success: false,
      message: `Location Unauthorized: You are ${distance}m away from the authorized office location (${officeLocation.name}). Attendance actions are only permitted within ${allowedRadius}m.`,
      distance,
      allowedRadius,
      officeName: officeLocation.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      userCoordinates: coords,
      officeLocation,
    };
  }

  return {
    success: true,
    latitude: coords.latitude,
    longitude: coords.longitude,
    distance,
    officeName: officeLocation.name,
    allowedRadius,
    officeLocation,
  };
};
