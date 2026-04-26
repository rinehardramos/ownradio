import { prisma } from '../src/db/client.js';
import { generateDjAvatar } from '../src/services/avatarGenerator.js';

async function main() {
  const djs = await prisma.dJ.findMany({
    where: { avatarUrl: null },
    include: { station: { select: { genre: true } } },
  });

  console.log(`Found ${djs.length} DJs without avatars`);

  for (const dj of djs) {
    try {
      const avatarUrl = await generateDjAvatar({
        djId: dj.id,
        djName: dj.name,
        djBio: dj.bio,
        genre: dj.station.genre,
      });
      await prisma.dJ.update({ where: { id: dj.id }, data: { avatarUrl } });
      console.log(`+ ${dj.name} -> ${avatarUrl}`);
    } catch (err) {
      console.error(`- ${dj.name}:`, err);
    }
    // Rate limit: 1 req/s
    await new Promise((r) => setTimeout(r, 1000));
  }

  await prisma.$disconnect();
}

main();
