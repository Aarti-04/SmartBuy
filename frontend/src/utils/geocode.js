/**
 * Reverse geocoding helper using client-side free APIs (BigDataCloud with Nominatim fallback)
 * Resolves latitude and longitude coordinates into a human-readable city/locality name.
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || '';
      const city = data.city || data.principalSubdivision || '';
      if (locality && city) {
        return `${locality}, ${city}`;
      } else if (city) {
        return city;
      }
    }
  } catch (err) {
    console.warn('BigDataCloud geocoding failed, trying Nominatim fallback...', err);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const suburb = address.suburb || address.neighbourhood || address.village || address.subdivision || '';
      const city = address.city || address.town || address.county || address.state || '';
      if (suburb && city) {
        return `${suburb}, ${city}`;
      } else if (city) {
        return city;
      } else if (data.display_name) {
        const parts = data.display_name.split(',');
        if (parts.length > 1) {
          return `${parts[0].trim()}, ${parts[1].trim()}`;
        }
        return parts[0].trim();
      }
    }
  } catch (err) {
    console.error('Nominatim reverse geocoding failed...', err);
  }

  return null;
};
