import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js"; 

const FINANCE_SHEET_ID = process.env.GOOGLE_FINANCE_SHEET_ID;
const FINANCE_SHEET_NAME = "Sheet1"; // change if different

// ✅ Column Order in Sheet
const HEADERS = [
  "id",
  "meetingname",
  "meetingdate",
  "totalamount",
  "food",
  "preacher",
  "other",
  "totalspendings",
  "balance",
  "donations",
  "accountbalance",
  "createdAt",
  "modifiedAt",
  "modifiedBy",
  "iseditable"
];

// ✅ Helper to convert sheet rows → JSON objects
function parseRows(rows: string[][]) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const entry: Record<string, string> = {};
    headers.forEach((h, idx) => (entry[h] = row[idx] || ""));
    return entry;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      // ✅ FETCH all finance rows
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: FINANCE_SHEET_ID,
        range: FINANCE_SHEET_NAME,
      });

      const rows = response.data.values || [];
      const data = parseRows(rows);
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      // ✅ ADD new finance entry
      const body = req.body;
      if (!body.meetingname || !body.meetingdate)
        return res.status(400).json({ message: "Missing required fields" });

      // ✅ Create new row in same column order
      const newRow = [
        body.id || Date.now().toString(),
        body.meetingname,
        body.meetingdate,
        body.totalamount || "0",
        body.food || "0",
        body.preacher || "0",
        body.other || "0",
        body.totalspendings || "0",
        body.balance || "0",
        body.donations || "0",
        body.accountbalance || "0",
        body.createdAt || "0",
        body.modifiedAt || "0",
        body.modifiedBy || "system",
        body.iseditable || "TRUE"
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: FINANCE_SHEET_ID,
        range: FINANCE_SHEET_NAME,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });

      return res.status(200).json({ message: "Finance entry added" });
    }

    if (req.method === "PUT") {
      // ✅ UPDATE existing row (by meetingdate)
      const body = req.body;
      if (!body.meetingdate)
        return res.status(400).json({ message: "Missing meetingdate" });

      // Fetch current rows
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: FINANCE_SHEET_ID,
        range: FINANCE_SHEET_NAME,
      });

      const rows = response.data.values || [];
      const headers = rows[0];
      const idx = rows.findIndex((row) => row[2] === body.meetingdate);

      if (idx === -1)
        return res.status(404).json({ message: "Meeting not found" });

      // Build updated row
      const updatedRow = [
        body.id || rows[idx][0],
        body.meetingname || rows[idx][1],
        body.meetingdate,
        body.totalamount || rows[idx][3],
        body.food || rows[idx][4],
        body.preacher || rows[idx][5],
        body.other || rows[idx][6],
        body.totalspendings || rows[idx][7],
        body.balance || rows[idx][8],
        body.donations || rows[idx][9],
        body.accountbalance || rows[idx][10],
        body.createdAt || rows[idx][11],
        body.modifiedAt || rows[idx][12],
        body.modifiedBy || rows[idx][13],
        body.iseditable || rows[idx][14],
      ];

      // Update the exact row
      const updateRange = `${FINANCE_SHEET_NAME}!A${idx + 1}:O${idx + 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: FINANCE_SHEET_ID,
        range: updateRange,
        valueInputOption: "RAW",
        requestBody: { values: [updatedRow] },
      });

      return res.status(200).json({ message: "Finance entry updated" });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("❌ Finance API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
