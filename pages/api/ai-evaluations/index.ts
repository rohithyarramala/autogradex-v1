import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';
import { enqueueRubricsCreationJob } from '@/lib/ai-evaluation-queue';


export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleFileUpload(req: NextApiRequest) {
  const uploadDir = path.join(process.cwd(), 'uploads', 'pdfs');
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
    filename: (name, ext, part) =>
      `${Date.now()}-${part.originalFilename || name}`,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get session & organization
    const session = await getSession(req, res);
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
    const organizationId = session.user.organizationId;

    switch (req.method) {
      case 'GET': {
        if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing organizationId' });
      }
        const evaluations = await prisma.evaluation.findMany({
          where: { organizationId : organizationId },
          include: { 
            class: true,
            section: true,
            subject: true,
            submissions: true,
          },
        });

        const mapped = evaluations.map((e) => ({
          id: e.id,
          name: e.name,
          classId: e.classId,
          sectionId: e.sectionId,
          subjectId: e.subjectId,
          status: e.status,
          organizationId: e.organizationId,
          students: e.submissions.map((s) => ({ id: s.studentId, name: '' })),
          questionPdf: e.questionPdf,
          keyScript: e.answerKey,
        }));

        return res.status(200).json(mapped);
      }

      case 'POST': {
        const { fields, files } = await handleFileUpload(req);

        const resolveUploadedFileUrl = (fileField: any) => {
          if (!fileField) return '';
          const file = Array.isArray(fileField) ? fileField[0] : fileField;
          const fp = (file.filepath || (file as any).path);
          return fp ? `/api/pdf/${path.basename(fp)}` : '';
        };

        const evaluationData = {
          name: Array.isArray(fields.name) ? fields.name[0] : fields.name,
          classId: Array.isArray(fields.classId) ? fields.classId[0] : fields.classId,
          sectionId: Array.isArray(fields.sectionId) ? fields.sectionId[0] : fields.sectionId,
          subjectId: Array.isArray(fields.subjectId) ? fields.subjectId[0] : fields.subjectId,
          maxMarks: Number(fields.maxMarks),
          questionPdf: resolveUploadedFileUrl(files.questionPaper),
          answerKey: resolveUploadedFileUrl(files.keyScript),
          status: 'not-started',
          organizationId: organizationId || '',
          uploadedBy:Array.isArray(fields.uploadedBy) ? fields.uploadedBy[0] : fields.uploadedBy,
          createdBy: Array.isArray(fields.createdBy) ? fields.createdBy[0] : fields.createdBy,
        };

        if (!evaluationData.name || !evaluationData.classId || !evaluationData.sectionId || !evaluationData.subjectId || !evaluationData.createdBy) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Foreign key validations
        const user = await prisma.user.findUnique({ where: { id: evaluationData.createdBy } });
        if (!user) return res.status(400).json({ error: `Invalid createdBy: ${evaluationData.createdBy}` });

        const classRecord = await prisma.class.findUnique({ where: { id: evaluationData.classId } });
        if (!classRecord) return res.status(400).json({ error: `Invalid classId: ${evaluationData.classId}` });

        const section = await prisma.section.findUnique({ where: { id: evaluationData.sectionId } });
        if (!section) return res.status(400).json({ error: `Invalid sectionId: ${evaluationData.sectionId}` });

        const subject = await prisma.subject.findUnique({ where: { id: evaluationData.subjectId } });
        if (!subject) return res.status(400).json({ error: `Invalid subjectId: ${evaluationData.subjectId}` });

        if (!evaluationData.organizationId || typeof evaluationData.organizationId !== 'string') {
          return res.status(400).json({ error: 'Invalid or missing organizationId' });
        }
        // Create evaluation
        const evaluation = await prisma.evaluation.create({ data: evaluationData });

        // Create submissions for enrolled students
        const enrollments = await prisma.studentEnrollment.findMany({
          where: { sectionId: evaluationData.sectionId,classId:evaluationData.classId },
          include: { student: true },
        });

        const submissions = await Promise.all(enrollments.map((enrollment) =>
          prisma.evaluationSubmission.create({
            data: {
              evaluationId: evaluation.id,
              studentId: enrollment.studentId,
              status: 'not-uploaded',
              isAbsent: false,
            },
          })
        ));

        enqueueRubricsCreationJob(evaluation.id);
        
        return res.status(201).json({ ...evaluation, submissions });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing evaluation ID' });
        const evaluationId = Array.isArray(id) ? id[0] : id;

        const evalToDelete = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
        if (!evalToDelete) return res.status(404).json({ error: 'Evaluation not found' });
        if (evalToDelete.organizationId !== organizationId) return res.status(403).json({ error: 'Forbidden' });

        // Delete PDF files
        const filesToDelete = [evalToDelete.questionPdf, evalToDelete.answerKey];
        for (const fileUrl of filesToDelete) {
          if (!fileUrl) continue;
          const filename = fileUrl.split('/').pop();
          if (!filename) continue;
          const filePath = path.join(process.cwd(), 'uploads', 'pdfs', filename);
          try { await fs.unlink(filePath); } catch (err) { console.warn(`Failed to delete file ${filename}`, err); }
        }

        await prisma.evaluation.delete({ where: { id: evaluationId } });
        return res.status(204).end();
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error in handler:', error);
    return res.status(500).json({ error: error.message });
  }
}
