import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email exists in users table
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return res.status(200).json({ available: !user });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
