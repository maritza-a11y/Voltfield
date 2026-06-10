import exifr from 'exifr'

export async function readExif(file) {
  if (!file.type.startsWith('image/')) return null
  try {
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'Make', 'Model'],
    })
    if (!data) return null
    return {
      lat:   data.latitude  ?? null,
      lng:   data.longitude ?? null,
      date:  data.DateTimeOriginal ?? null,
      make:  data.Make  ?? null,
      model: data.Model ?? null,
    }
  } catch {
    return null
  }
}
