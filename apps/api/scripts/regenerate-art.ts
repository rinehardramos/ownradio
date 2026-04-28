/**
 * One-shot script: regenerate DJ avatars + station artwork using DALL-E.
 *
 * Usage:
 *   npx tsx scripts/regenerate-art.ts          # all DJs + all stations
 *   npx tsx scripts/regenerate-art.ts --djs     # DJs only
 *   npx tsx scripts/regenerate-art.ts --stations # stations only
 *
 * Reads the same env vars as the API server (OPENAI_API_KEY, S3_*, etc.)
 */

import 'dotenv/config';
import { prisma } from '../src/db/client.js';
import { generateDjAvatar } from '../src/services/avatarGenerator.js';
import { forceRegenerateArtwork } from '../src/services/artworkGenerator.js';

const args = process.argv.slice(2);
const onlyDjs = args.includes('--djs');
const onlyStations = args.includes('--stations');
const runDjs = !onlyStations;
const runStations = !onlyDjs;

async function regenerateDjAvatars() {
  const djs = await prisma.dJ.findMany({
    select: { id: true, name: true, bio: true, stationId: true, station: { select: { genre: true } } },
  });

  console.log(`\nRegenerating avatars for ${djs.length} DJ(s)...`);

  for (const dj of djs) {
    try {
      process.stdout.write(`  ${dj.name} ... `);
      const avatarUrl = await generateDjAvatar({
        djId: dj.id,
        djName: dj.name,
        djBio: dj.bio ?? '',
        genre: dj.station?.genre ?? 'pop',
      });
      await prisma.dJ.update({ where: { id: dj.id }, data: { avatarUrl } });
      console.log(`done → ${avatarUrl}`);
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function regenerateStationArtwork() {
  const stations = await prisma.station.findMany({
    select: { id: true, slug: true, name: true },
  });

  console.log(`\nRegenerating artwork for ${stations.length} station(s)...`);

  for (const station of stations) {
    try {
      process.stdout.write(`  ${station.name} (${station.slug}) ... `);
      await forceRegenerateArtwork(station.id);
      const updated = await prisma.station.findUnique({ where: { id: station.id }, select: { artworkUrl: true } });
      console.log(`done → ${updated?.artworkUrl ?? '(no songs to base art on)'}`);
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function main() {
  console.log('OwnRadio — Art Regeneration Script');
  console.log('Provider:', process.env.ARTWORK_PROVIDER ?? 'openai', '/', process.env.AVATAR_PROVIDER ?? 'openai');

  if (runDjs) await regenerateDjAvatars();
  if (runStations) await regenerateStationArtwork();

  console.log('\nDone.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
