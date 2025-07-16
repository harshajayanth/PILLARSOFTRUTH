import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../lib/jwt.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const decoded = verifyToken(token);

    return res.status(200).json({
      email: decoded?.email,
      name: decoded?.name,
      picture: decoded?.picture,
      role: decoded?.role,
      isAuthenticated: true, 
    });
  } catch (err) {
    console.error("Invalid token", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
