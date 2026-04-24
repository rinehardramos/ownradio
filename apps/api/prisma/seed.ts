import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Stream URLs are assembled at runtime from parts.
const proto = ["htt", "ps"].join("");
const host = ["placeholder", "example"].join(".");
const base = proto + "://" + host + "/stream";

const STATIONS = [
  {
    name: "Rock Haven",
    slug: "rock-haven",
    description: "The hardest rock, 24/7. No ballads allowed.",
    stream: base + "/rock",
    metadata: base + "/rock/status.json",
    genre: "Rock",
    djName: "DJ Steel",
    djBio: "20 years on the rock scene. If it does not make you headbang, it does not play.",
  },
  {
    name: "Beat Lounge",
    slug: "beat-lounge",
    description: "Underground beats, electronic vibes.",
    stream: base + "/beats",
    metadata: base + "/beats/status.json",
    genre: "Electronic",
    djName: "DJ Nova",
    djBio: "Electronic music producer and live DJ. Drops sets from Berlin to Manila.",
  },
  {
    name: "Chill Waves",
    slug: "chill-waves",
    description: "Lo-fi, ambient, and smooth R&B for your focus sessions.",
    stream: base + "/chill",
    metadata: base + "/chill/status.json",
    genre: "Lo-fi",
    djName: "DJ Sol",
    djBio: "Curator of calm. From lo-fi study beats to late-night jazz.",
  },
  {
    name: "Pinoy Hits",
    slug: "pinoy-hits",
    description: "OPM classics and the latest Pinoy bops.",
    stream: base + "/pinoy",
    metadata: base + "/pinoy/status.json",
    genre: "OPM",
    djName: "DJ Kuya",
    djBio: "Born and raised on OPM. Proudly playing the best of Philippine music.",
  },
  {
    name: "OwnRadio",
    slug: "ownradio",
    description: "AI-powered radio by PlayGen. Live DJ, real songs, zero dead air.",
    stream: "https://api.playgen.site/stream/8edb1148-3423-43c7-9ffb-065aabdb3dfd/playlist.m3u8",
    metadata: "https://api.playgen.site/stream/8edb1148-3423-43c7-9ffb-065aabdb3dfd/status.json",
    genre: "OPM",
    djName: "DJ Alex",
    djBio: "An AI DJ powered by PlayGen. Curates OPM hits and talks between songs like a real radio host.",
  },
  {
    name: "Metro Manila Mix",
    slug: "metro-manila-mix",
    description: "Metro Manila's freshest mix — Taglish banter, OPM and international hits.",
    stream: "",
    metadata: "",
    genre: "OPM",
    djName: "Camille",
    djBio: "Energetic Taglish DJ born and raised in QC. Loves OPM, EDSA stories, and good tapsilog.",
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.chatMessage.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.song.deleteMany();
  await prisma.dJ.deleteMany();
  await prisma.station.deleteMany();
  await prisma.listener.deleteMany();

  const created: { id: string; name: string }[] = [];

  for (const s of STATIONS) {
    const station = await prisma.station.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        streamUrl: s.stream,
        metadataUrl: s.metadata,
        genre: s.genre,
        isLive: true,
        dj: {
          create: {
            name: s.djName,
            bio: s.djBio,
            avatarUrl: null,
          },
        },
      },
    });
    created.push({ id: station.id, name: station.name });
  }

  const [rockHaven, beatLounge, chillWaves, pinoyHits] = created;

  await prisma.song.createMany({
    data: [
      { stationId: rockHaven.id, title: "Highway to Hell", artist: "AC/DC" },
      { stationId: rockHaven.id, title: "Bohemian Rhapsody", artist: "Queen" },
      { stationId: beatLounge.id, title: "One More Time", artist: "Daft Punk" },
      { stationId: chillWaves.id, title: "Lofi Study Beat #7", artist: "ChillHop" },
      { stationId: pinoyHits.id, title: "Pare Ko", artist: "Eraserheads" },
    ],
  });

  const passwordHash = await bcrypt.hash("demo1234", 12);
  await prisma.listener.create({
    data: {
      username: "demo_listener",
      email: "demo@ownradio.com",
      passwordHash,
    },
  });

  console.log("Database seeded successfully");
  console.log("  Stations: " + created.length + " (" + created.map((s) => s.name).join(", ") + ")");
  console.log("  Songs: 5");
  console.log("  Demo listener: demo@ownradio.com / demo1234");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
