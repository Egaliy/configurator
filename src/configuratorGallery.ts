/** Preview videos: site type × animation level (1–4). */
export const GALLERY_MATRIX = [
  // Basic, Advanced, Cinematic, Immersive
  ['case-1', 'case-2', 'case-3', 'case-4'],
  ['case-5', 'case-6', 'case-7', 'case-8'],
  ['case-9', 'case-10', 'case-11', 'case-12'],
  ['case-13', 'case-14', 'case-15', 'case-16'],
] as const

export type GalleryVideoId = (typeof GALLERY_MATRIX)[number][number]

/** Missing cases fall back to nearest available video file. */
const MISSING_CASE_FALLBACK: Partial<Record<GalleryVideoId, GalleryVideoId>> = {
  'case-11': 'case-10',
  'case-12': 'case-13',
  'case-14': 'case-15',
  'case-16': 'case-15',
}

/** Unique video files on disk (12 files). */
export const GALLERY_VIDEO_FILES: GalleryVideoId[] = [
  'case-1',
  'case-2',
  'case-3',
  'case-4',
  'case-5',
  'case-6',
  'case-7',
  'case-8',
  'case-9',
  'case-10',
  'case-13',
  'case-15',
]

function resolveVideoId(id: GalleryVideoId | string): GalleryVideoId {
  return (MISSING_CASE_FALLBACK[id as GalleryVideoId] ?? id) as GalleryVideoId
}

export function getGalleryVideoSrc(id: GalleryVideoId | string): string {
  return `/imgs/gallery/${resolveVideoId(id)}.mp4`
}

/** All unique video srcs used in the matrix (for stacked preview layers). */
export function getAllGalleryVideoSrcs(): string[] {
  const seen = new Set<string>()
  for (const row of GALLERY_MATRIX) {
    for (const id of row) {
      seen.add(getGalleryVideoSrc(id))
    }
  }
  return [...seen]
}

export function getGalleryPreviewSrc(siteTypeIndex: number, animation: number): string {
  const site = Math.min(GALLERY_MATRIX.length - 1, Math.max(0, siteTypeIndex))
  const anim = Math.min(4, Math.max(1, animation)) - 1
  return getGalleryVideoSrc(GALLERY_MATRIX[site][anim])
}

/** Preload all gallery videos into the browser cache. */
export function preloadGalleryVideos(): void {
  for (const id of GALLERY_VIDEO_FILES) {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.src = getGalleryVideoSrc(id)
    video.load()
  }
}
