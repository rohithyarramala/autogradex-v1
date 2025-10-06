import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Utility to validate file names
const isValidFileName = (fileName: string): boolean => {
  // Allow alphanumeric, underscores, hyphens, commas, spaces, and .pdf extension
  return /^[a-zA-Z0-9_,\- ]+\.pdf$/.test(fileName);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { file } = req.query;

    // If no file is specified, return a list of available PDFs
    if (!file || Array.isArray(file)) {
      const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!existsSync(uploadDir)) {
        return res.status(200).json({ files: [] });
      }
      const files = await fs.readdir(uploadDir);
      const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf") && isValidFileName(f));
      return res.status(200).json({ files: pdfFiles });
    }

    // Decode and validate the file name
    const fileName = decodeURIComponent(file as string);
    if (!isValidFileName(fileName)) {
      return res.status(400).json({ error: "Invalid file name. Only PDFs with alphanumeric, underscores, hyphens, commas, and spaces are allowed." });
    }

    // Construct safe file path
    const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
    const filePath = path.join(uploadDir, fileName);

    // Check if the file exists
    console.log("Serving file from path:", filePath);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // Read and serve the file
    const fileBuffer = await fs.readFile(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.send(fileBuffer);
  } catch (err) {
    console.error("Error serving PDF:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}