import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleFileUpload(req: NextApiRequest) {
  const uploadDir = path.join('public', 'files');
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
    filename: (name, ext, part) =>
      `${Date.now()}-${part.originalFilename || name}${ext}`,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET': {
        const evaluations = await prisma.evaluation.findMany({
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
          students: e.submissions.map((s) => ({
            id: s.studentId,
            name: '',
          })),
          questionPaper: e.questionPdf,
          keyScript: e.answerKey,
        }));
        res.status(200).json(mapped);
        break;
      }
      case 'POST': {
        const { fields, files } = (await handleFileUpload(req)) as {
          fields: formidable.Fields;
          files: formidable.Files;
        };

        const year = new Date().getFullYear().toString();
        const evaluationData = {
          name: Array.isArray(fields.name) ? fields.name[0] : fields.name,
          classId: Array.isArray(fields.classId)
            ? fields.classId[0]
            : fields.classId,
          sectionId: Array.isArray(fields.sectionId)
            ? fields.sectionId[0]
            : fields.sectionId,
          subjectId: Array.isArray(fields.subjectId)
            ? fields.subjectId[0]
            : fields.subjectId,
          maxMarks: Number(fields.maxMarks),
          questionPdf:
            files.questionPaper &&
            !Array.isArray(files.questionPaper) &&
            files.questionPaper?.filepath
              ? `/files/${path.basename(files.questionPaper[0].filepath)}`
              : '',
          answerKey:
            files.keyScript &&
            !Array.isArray(files.keyScript) &&
            files.keyScript?.filepath
              ? `/files/${path.basename(files.keyScript[0].filepath)}`
              : '',
          status: 'pending',
          createdBy: Array.isArray(fields.createdBy)
            ? fields.createdBy[0]
            : fields.createdBy,
        };

        // Validate required fields
        if (
          !evaluationData.name ||
          !evaluationData.classId ||
          !evaluationData.sectionId ||
          !evaluationData.subjectId ||
          !evaluationData.createdBy
        ) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate foreign keys
        const user = await prisma.user.findUnique({
          where: { id: evaluationData.createdBy },
        });
        if (!user) {
          return res.status(400).json({
            error: `Invalid createdBy value: ${evaluationData.createdBy} does not exist in User table`,
          });
        }

        const classRecord = await prisma.class.findUnique({
          where: { id: evaluationData.classId },
        });
        if (!classRecord) {
          return res.status(400).json({
            error: `Invalid classId: ${evaluationData.classId} does not exist in Class table`,
          });
        }

        const section = await prisma.section.findUnique({
          where: { id: evaluationData.sectionId },
        });
        if (!section) {
          return res.status(400).json({
            error: `Invalid sectionId: ${evaluationData.sectionId} does not exist in Section table`,
          });
        }

        const subject = await prisma.subject.findUnique({
          where: { id: evaluationData.subjectId },
        });
        if (!subject) {
          return res.status(400).json({
            error: `Invalid subjectId: ${evaluationData.subjectId} does not exist in Subject table`,
          });
        }

        // Create the evaluation
        const evaluation = await prisma.evaluation.create({
          data: evaluationData,
        });

        // Find all students enrolled in the section
        const enrollments = await prisma.studentEnrollment.findMany({
          where: {
            sectionId: evaluationData.sectionId,
          },
          include: {
            student: true,
          },
        });

        // Create EvaluationSubmission for each student
        const submissions = await Promise.all(
          enrollments.map((enrollment) =>
            prisma.evaluationSubmission.create({
              data: {
                evaluationId: evaluation.id,
                studentId: enrollment.studentId,
                status: 'submitted',
                isAbsent: false,
              },
            })
          )
        );

        return res.status(201).json({ ...evaluation, submissions });
      }
      case 'DELETE': {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Missing evaluation ID' });
        }

        // req.query values are always string | string[] in Next.js
        const evaluationId = Array.isArray(id) ? id[0] : id;

        // Delete from Prisma
        await prisma.evaluation.delete({ where: { id: evaluationId } });

        res.status(204).end();
        break;
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
