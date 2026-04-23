-- Data migration: insert default stations and DJs if they don't exist.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

-- Stations have no FK dependency, insert first.
INSERT INTO "stations" ("id", "name", "slug", "description", "stream_url", "metadata_url", "genre", "is_live", "created_at", "updated_at") VALUES
  ('station-rock-001',  'Rock Haven',  'rock-haven',  'The hardest rock, 24/7. No ballads allowed.',              'https://placeholder.example/stream/rock',  'https://placeholder.example/stream/rock/status.json',  'Rock',       true, NOW(), NOW()),
  ('station-beats-001', 'Beat Lounge', 'beat-lounge', 'Underground beats, electronic vibes.',                      'https://placeholder.example/stream/beats', 'https://placeholder.example/stream/beats/status.json', 'Electronic', true, NOW(), NOW()),
  ('station-chill-001', 'Chill Waves', 'chill-waves', 'Lo-fi, ambient, and smooth R&B for your focus sessions.',  'https://placeholder.example/stream/chill', 'https://placeholder.example/stream/chill/status.json', 'Lo-fi',      true, NOW(), NOW()),
  ('station-pinoy-001', 'Pinoy Hits',  'pinoy-hits',  'OPM classics and the latest Pinoy bops.',                  'https://placeholder.example/stream/pinoy', 'https://placeholder.example/stream/pinoy/status.json', 'OPM',        true, NOW(), NOW()),
  ('station-own-001',   'OwnRadio',    'ownradio',    'AI-powered radio by PlayGen. Live DJ, real songs, zero dead air.', 'https://api.playgen.site/stream/8edb1148-3423-43c7-9ffb-065aabdb3dfd/playlist.m3u8', 'https://api.playgen.site/stream/8edb1148-3423-43c7-9ffb-065aabdb3dfd/status.json', 'OPM', true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- DJs reference stations via station_id FK.
INSERT INTO "djs" ("id", "station_id", "name", "bio", "avatar_url") VALUES
  ('dj-steel-001', 'station-rock-001',  'DJ Steel', '20 years on the rock scene. If it does not make you headbang, it does not play.', NULL),
  ('dj-nova-001',  'station-beats-001', 'DJ Nova',  'Electronic music producer and live DJ. Drops sets from Berlin to Manila.', NULL),
  ('dj-sol-001',   'station-chill-001', 'DJ Sol',   'Curator of calm. From lo-fi study beats to late-night jazz.', NULL),
  ('dj-kuya-001',  'station-pinoy-001', 'DJ Kuya',  'Born and raised on OPM. Proudly playing the best of Philippine music.', NULL),
  ('dj-alex-001',  'station-own-001',   'DJ Alex',  'An AI DJ powered by PlayGen. Curates OPM hits and talks between songs like a real radio host.', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Sample songs.
INSERT INTO "songs" ("id", "station_id", "title", "artist") VALUES
  ('song-001', 'station-rock-001',  'Highway to Hell',    'AC/DC'),
  ('song-002', 'station-rock-001',  'Bohemian Rhapsody',  'Queen'),
  ('song-003', 'station-beats-001', 'One More Time',      'Daft Punk'),
  ('song-004', 'station-chill-001', 'Lofi Study Beat #7', 'ChillHop'),
  ('song-005', 'station-pinoy-001', 'Pare Ko',            'Eraserheads')
ON CONFLICT ("id") DO NOTHING;
