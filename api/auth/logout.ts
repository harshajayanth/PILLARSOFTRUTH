// api/auth/logout.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    `auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure" : ""
    }`
  );
  res.status(200).json({ success: true });
}
