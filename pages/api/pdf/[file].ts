// app/api/pdf/[file]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req, { params }) {
  const filePath = path.join(process.cwd(), "public", "files", params.file);
  const file = fs.readFileSync(filePath);
  return new NextResponse(file, {
    headers: { "Content-Type": "application/pdf" },
  });
}
