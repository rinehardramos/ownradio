import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../lib/jwt.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    (request as any).user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}
