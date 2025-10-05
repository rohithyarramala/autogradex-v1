import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });

  switch (req.method) {
    case 'GET':
      // Get class by id (scoped to organization)
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const classItem = await prisma.class.findFirst({ where: { id, organizationId: String(organizationId) } });
        if (!classItem) return res.status(404).json({ error: 'Class not found' });
        return res.status(200).json(classItem);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'PUT':
      // Update class
      const { name } = req.body;
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const updated = await prisma.class.updateMany({
          where: { id, organizationId: String(organizationId) },
          data: { name },
        });

        if (updated.count === 0) return res.status(404).json({ error: 'Class not found or not in your organization' });
        // Fetch and return updated record
        const updatedRecord = await prisma.class.findUnique({ where: { id } });
        return res.status(200).json(updatedRecord);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'DELETE':
      // Delete class
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const deleted = await prisma.class.deleteMany({ where: { id, organizationId: String(organizationId) } });
        if (deleted.count === 0) return res.status(404).json({ error: 'Class not found or not in your organization' });
        return res.status(204).end();
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
