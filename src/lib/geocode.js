export async function geocodeAddress(address, city) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key || key.includes('your-google')) return null

  const query = encodeURIComponent(`${address}, ${city}`)
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`,
    )
    const data = await res.json()
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
  } catch {
    // Geocoding is best-effort; silently fail.
  }
  return null
}
