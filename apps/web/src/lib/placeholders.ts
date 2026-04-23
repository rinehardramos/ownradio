const GENRE_MAP: Record<string, string> = {
  pop: '/placeholders/stations/pop.jpg',
  rock: '/placeholders/stations/rock.jpg',
  'hip-hop': '/placeholders/stations/hiphop.jpg',
  hiphop: '/placeholders/stations/hiphop.jpg',
  'lo-fi': '/placeholders/stations/lofi.jpg',
  lofi: '/placeholders/stations/lofi.jpg',
  opm: '/placeholders/stations/opm.jpg',
};

export function getStationPlaceholder(genre?: string | null): string {
  if (!genre) return '/placeholders/stations/default.jpg';
  return GENRE_MAP[genre.toLowerCase()] ?? '/placeholders/stations/default.jpg';
}

const DJ_PLACEHOLDERS = [
  '/placeholders/djs/1.jpg',
  '/placeholders/djs/2.jpg',
  '/placeholders/djs/3.jpg',
  '/placeholders/djs/4.jpg',
  '/placeholders/djs/5.jpg',
  '/placeholders/djs/6.jpg',
];

const SONG_PLACEHOLDERS = [
  '/placeholders/songs/1.jpg',
  '/placeholders/songs/2.jpg',
  '/placeholders/songs/3.jpg',
  '/placeholders/songs/4.jpg',
  '/placeholders/songs/5.jpg',
  '/placeholders/songs/6.jpg',
];

/** Deterministic index — same id always maps to the same image. */
function pickIndex(id: string, len: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % len;
}

export function getDJPlaceholder(id?: string | null, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  if (!id) return DJ_PLACEHOLDERS[0];
  return DJ_PLACEHOLDERS[pickIndex(id, DJ_PLACEHOLDERS.length)];
}

export function getSongPlaceholder(id?: string | null, albumCoverUrl?: string | null): string {
  if (albumCoverUrl) return albumCoverUrl;
  if (!id) return SONG_PLACEHOLDERS[0];
  return SONG_PLACEHOLDERS[pickIndex(id, SONG_PLACEHOLDERS.length)];
}

/** Legacy exports — kept for any remaining direct imports. */
export const DJ_PLACEHOLDER = DJ_PLACEHOLDERS[0];
export const SONG_PLACEHOLDER = SONG_PLACEHOLDERS[0];
export const PROFILE_PLACEHOLDER = '/placeholders/profile/default.jpg';
