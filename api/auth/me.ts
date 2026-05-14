import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, respondError, methodNotAllowed } from "../../server/lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const user = requireAuth(req, res);
  if (!user) return;

  return res.status(200).json({
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    isAuthenticated: true,
  });
}
