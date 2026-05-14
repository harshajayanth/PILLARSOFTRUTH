import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, type AuthUser } from "./jwt.js";

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; message: string };

export function respondSuccess<T = unknown>(res: VercelResponse, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function respondError(res: VercelResponse, message: string, status = 400) {
  return res.status(status).json({ success: false, message });
}

export function unauthorized(res: VercelResponse) {
  return respondError(res, "Unauthorized", 401);
}

export function forbidden(res: VercelResponse) {
  return respondError(res, "Forbidden", 403);
}

export function methodNotAllowed(res: VercelResponse, allowedMethods: string[]) {
  res.setHeader("Allow", allowedMethods.join(", "));
  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, raw) => {
    const [name, ...rest] = raw.trim().split("=");
    if (!name) return cookies;
    cookies[name] = rest.join("=");
    return cookies;
  }, {});
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken) return cookieToken;

  const headerCookies = req.headers?.cookie;
  if (!headerCookies) return null;

  const parsed = parseCookies(headerCookies);
  return parsed["auth_token"] || null;
}

export function getUserFromToken(req: VercelRequest): AuthUser | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = getUserFromToken(req);
  if (!user) {
    unauthorized(res);
    return null;
  }
  return user;
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = getUserFromToken(req);
  if (!user) {
    unauthorized(res);
    return null;
  }
  if (user.role !== "admin") {
    forbidden(res);
    return null;
  }
  return user;
}

export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse, user: AuthUser) => Promise<unknown> | unknown
) {
  return async function authHandler(req: VercelRequest, res: VercelResponse) {
    const user = getUserFromToken(req);
    if (!user) {
      return unauthorized(res);
    }
    return handler(req, res, user);
  };
}

export function withAdmin(
  handler: (req: VercelRequest, res: VercelResponse, user: AuthUser) => Promise<unknown> | unknown
) {
  return async function adminHandler(req: VercelRequest, res: VercelResponse) {
    const user = getUserFromToken(req);
    if (!user) {
      return unauthorized(res);
    }
    if (user.role !== "admin") {
      return forbidden(res);
    }
    return handler(req, res, user);
  };
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
