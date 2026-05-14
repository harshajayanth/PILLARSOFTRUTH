// api/auth/logout.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed } from "../../server/lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }
  res.setHeader(
    "Set-Cookie",
    `auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure" : ""
    }`
  );
  return res.status(200).json({ message: "Logged out" });
}
