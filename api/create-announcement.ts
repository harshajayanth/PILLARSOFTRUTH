// api/create-announcement.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const redirectUrl = process.env.GOOGLE_FORM_URL;

  if (!redirectUrl) {
    return res.status(500).send("Redirect URL not configured");
  }

  res.writeHead(302, { Location: redirectUrl });
  res.end();
}
