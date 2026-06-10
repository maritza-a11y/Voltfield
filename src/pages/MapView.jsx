import { useEffect, useState } from 'react'
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Link } from 'react-router-dom'
import { getJobs, getAllFiles } from '../lib/jobs'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

export default function MapView() {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: KEY ?? '' })

  const [jobs, setJobs] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // { type: 'job'|'photo', data }

  useEffect(() => {
    Promise.all([getJobs(), getAllFiles({ section: 'photos' })]).then(([{ data: j }, { data: p }]) => {
      setJobs((j ?? []).filter((job) => job.lat && job.lng))
      setPhotos((p ?? []).filter((f) => f.photo_lat && f.photo_lng))
      setLoading(false)
    })
  }, [])

  if (!KEY || KEY.includes('your-google')) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-navy-200 text-center">
        <p className="text-lg font-semibold text-navy-700">Google Maps not configured</p>
        <p className="max-w-sm text-sm text-navy-400">
          Add <code className="rounded bg-navy-100 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to your{' '}
          <code className="rounded bg-navy-100 px-1">.env</code> file and restart the dev server.
        </p>
      </div>
    )
  }

  if (loading || !isLoaded) {
    return <div className="flex h-64 items-center justify-center"><Spinner label="Loading map…" /></div>
  }

  const center = jobs.length
    ? { lat: jobs[0].lat, lng: jobs[0].lng }
    : { lat: 34.052235, lng: -118.243683 } // default: LA

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Map</h1>
          <p className="text-sm text-navy-500">
            {jobs.length} job location{jobs.length !== 1 ? 's' : ''} ·{' '}
            {photos.length} photo GPS pin{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-600" /> Job location
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-brand-accent" /> Photo GPS
          </span>
        </div>
      </div>

      <GoogleMap
        mapContainerClassName="w-full rounded-2xl overflow-hidden shadow"
        mapContainerStyle={{ height: 'calc(100vh - 220px)', minHeight: 400 }}
        center={center}
        zoom={jobs.length === 1 ? 13 : 10}
        options={{ styles: MAP_STYLE, zoomControl: true, mapTypeControl: false, streetViewControl: false }}
      >
        {/* Job pins — blue */}
        {jobs.map((job) => (
          <Marker
            key={job.id}
            position={{ lat: job.lat, lng: job.lng }}
            title={`${job.job_number} — ${job.client_name}`}
            onClick={() => setSelected({ type: 'job', data: job })}
          />
        ))}

        {/* Photo GPS pins — amber */}
        {photos.map((f) => (
          <Marker
            key={f.id}
            position={{ lat: f.photo_lat, lng: f.photo_lng }}
            title={f.file_name}
            onClick={() => setSelected({ type: 'photo', data: f })}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#f59e0b',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Info window for jobs */}
        {selected?.type === 'job' && (
          <InfoWindow
            position={{ lat: selected.data.lat, lng: selected.data.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="min-w-[180px] space-y-1 p-1 font-sans">
              <p className="text-xs font-bold text-navy-400">{selected.data.job_number}</p>
              <p className="font-semibold text-navy-900">{selected.data.client_name}</p>
              <p className="text-xs text-navy-500">{selected.data.address}</p>
              <p className="text-xs text-navy-500">{selected.data.job_type}</p>
              <Badge status={selected.data.status} />
              <a
                href={`/jobs/${selected.data.id}`}
                className="mt-2 block text-xs font-semibold text-blue-600 hover:underline"
              >
                View job →
              </a>
            </div>
          </InfoWindow>
        )}

        {/* Info window for photos */}
        {selected?.type === 'photo' && (
          <InfoWindow
            position={{ lat: selected.data.photo_lat, lng: selected.data.photo_lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="min-w-[160px] space-y-1 p-1 font-sans">
              <p className="text-xs font-bold text-amber-500">Photo GPS</p>
              <p className="text-sm font-semibold text-navy-900 break-all">{selected.data.file_name}</p>
              {selected.data.jobs && (
                <p className="text-xs text-navy-500">
                  {selected.data.jobs.job_number} · {selected.data.jobs.client_name}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
