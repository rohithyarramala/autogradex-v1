import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import * as XLSX from "xlsx";
import fs from "fs";
import { getSession } from "@/lib/session";
import {prisma} from "@/lib/prisma";
import { createStudent } from "@/models/student";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSession(req, res);
    const organizationId = session?.user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: "Unauthorized" });

    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = XLSX.read(fs.readFileSync(file.filepath), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let success = 0;
    let failed = 0;

    for (const row of rows) {
      const { Name, Email, Password, RollNo, ClassName, SectionName } = row as any;
      if (!Name || !Email || !Password) {
        failed++;
        continue;
      }
      console.log({ Name, Email, Password, RollNo, ClassName, SectionName });

      try {
        // map class & section
        const cls = await prisma.class.findFirst({
          where: { name: ClassName, organizationId },
        });
        const sec = await prisma.section.findFirst({
          where: { name: SectionName, organizationId },
        });

        console.log(cls, sec);
        await createStudent(
          {
            name: Name,
            email: Email,
            password: Password,
            rollNo: String(RollNo) || "",
            classId: cls?.id,
            sectionId: sec?.id,
          },
          organizationId
        );

        success++;
      } catch (err) {
        console.error("Error creating student:", err);
        failed++;
      }
    }

    res.status(200).json({ success, failed, total: rows.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
