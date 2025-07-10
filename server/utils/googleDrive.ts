import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/service-account-key.json"),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

export const drive = google.drive({
  version: "v3",
  auth,
});
