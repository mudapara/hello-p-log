import exifr from 'exifr'

export interface GpsCoords {
  latitude: number
  longitude: number
}

/** 写真ファイルの EXIF から GPS を読み取る（あれば） */
export async function extractGpsFromImageFile(file: File): Promise<GpsCoords | null> {
  try {
    const gps = await exifr.gps(file)
    if (!gps || typeof gps.latitude !== 'number' || typeof gps.longitude !== 'number') {
      return null
    }
    return { latitude: gps.latitude, longitude: gps.longitude }
  } catch {
    return null
  }
}
