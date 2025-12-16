import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMedicines } from "./storage-medicines";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const search = (req.query.search as string) || undefined;
    const medicines = getMedicines(search);
    return res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return res.status(500).json({ message: "Failed to fetch medicines" });
  }
}

