import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      // Get all subjects for the current user's organization only
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const subjects = await prisma.subject.findMany({ where: { organizationId: String(organizationId) } });
        return res.status(200).json(subjects);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'POST':
      // Create a new subject. The Subject model requires organizationId and a teacher relation.
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;

        if (!organizationId) {
          return res.status(401).json({ error: 'No organization found in session.' });
        }

        const { name, desc, teacherId } = req.body;

        if (!name || !desc || !teacherId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newSubject = await prisma.subject.create({
          data: {
            name,
            desc,
            teacherId: String(teacherId),
            organizationId: String(organizationId),
          },
        });
        return res.status(201).json(newSubject);
      } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create subject: ' + (error?.message || String(error)) });
      }
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
