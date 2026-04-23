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

export const DJ_PLACEHOLDER = '/placeholders/djs/default.jpg';
export const SONG_PLACEHOLDER = '/placeholders/songs/default.jpg';
export const PROFILE_PLACEHOLDER = '/placeholders/profile/default.jpg';
