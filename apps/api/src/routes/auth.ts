import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../db/client.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/register
  app.post<{ Body: { username: string; email: string; password: string } }>(
    "/auth/register",
    async (request, reply) => {
      const { username, email, password } = request.body;
      if (!username || !email || !password) {
        return reply.status(400).send({ error: "Missing required fields" });
      }
      if (password.length < 8) {
        return reply.status(400).send({ error: "Password must be at least 8 characters" });
      }
      const existing = await prisma.listener.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existing) {
        return reply.status(409).send({ error: "Email or username already taken" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const listener = await prisma.listener.create({
        data: { username, email, passwordHash },
      });
      const token = signToken({ userId: listener.id, username: listener.username });
      return reply.status(201).send({
        user: { id: listener.id, username: listener.username, email: listener.email },
        token,
      });
    }
  );

  // POST /auth/login
  app.post<{ Body: { email: string; password: string } }>(
    "/auth/login",
    async (request, reply) => {
      const { email, password } = request.body;
      if (!email || !password) {
        return reply.status(400).send({ error: "Missing required fields" });
      }
      const listener = await prisma.listener.findUnique({ where: { email } });
      if (!listener) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, listener.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }
      const token = signToken({ userId: listener.id, username: listener.username });
      return reply.status(200).send({
        user: { id: listener.id, username: listener.username, email: listener.email },
        token,
      });
    }
  );

  // GET /me
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user as { userId: string; username: string };
    const listener = await prisma.listener.findUnique({
      where: { id: user.userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!listener) {
      return reply.status(404).send({ error: "User not found" });
    }
    return listener;
  });
};
