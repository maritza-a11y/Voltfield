import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function JobMiniMap({ job, photoMarkers = [] }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: KEY ?? '' })

  if (!KEY || KEY.includes('your-google')) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-navy-100 text-sm text-navy-400">
        Add VITE_GOOGLE_MAPS_API_KEY to .env to enable the map.
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="h-48 animate-pulse rounded-xl bg-navy-100" />
  }

  if (!job.lat || !job.lng) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-navy-100 text-sm text-navy-400">
        No location data for this job.
      </div>
    )
  }

  const center = { lat: job.lat, lng: job.lng }

  return (
    <GoogleMap
      mapContainerClassName="h-48 w-full rounded-xl overflow-hidden"
      center={center}
      zoom={14}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <Marker position={center} title={`${job.job_number} — ${job.client_name}`} />
      {photoMarkers.map((m, i) => (
        <Marker
          key={i}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.file_name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  )
}
