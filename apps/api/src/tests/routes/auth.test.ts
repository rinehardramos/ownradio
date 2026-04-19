import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../server.js";

// Mock Prisma client
vi.mock("../../db/client.js", () => ({
  prisma: {
    listener: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
    compare: vi.fn(),
  },
}));

import { prisma } from "../../db/client.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../lib/jwt.js";

const MOCK_LISTENER = {
  id: "user1",
  username: "testuser",
  email: "test@example.com",
  passwordHash: "hashed",
  createdAt: new Date(),
};

describe("POST /auth/register", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("returns 201 with user (no passwordHash) and token on success", async () => {
    vi.mocked(prisma.listener.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.listener.create).mockResolvedValue(MOCK_LISTENER as any);

    const res = await supertest(app.server).post("/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.id).toBe("user1");
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 409 when email or username already taken", async () => {
    vi.mocked(prisma.listener.findFirst).mockResolvedValue(MOCK_LISTENER as any);

    const res = await supertest(app.server).post("/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email or username already taken");
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await supertest(app.server).post("/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must be at least 8 characters");
  });
});

describe("POST /auth/login", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("returns 200 with user and token on success", async () => {
    vi.mocked(prisma.listener.findUnique).mockResolvedValue(MOCK_LISTENER as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await supertest(app.server).post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe("user1");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(prisma.listener.findUnique).mockResolvedValue(MOCK_LISTENER as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await supertest(app.server).post("/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });
});

describe("GET /me", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("returns user data for valid Bearer token", async () => {
    const token = signToken({ userId: "user1", username: "testuser" });
    vi.mocked(prisma.listener.findUnique).mockResolvedValue({
      id: "user1",
      username: "testuser",
      email: "test@example.com",
      createdAt: new Date(),
    } as any);

    const res = await supertest(app.server)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user1");
    expect(res.body.username).toBe("testuser");
    expect(res.body.email).toBe("test@example.com");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await supertest(app.server).get("/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });
});
