import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });

  switch (req.method) {
    case 'GET':
      // Get section by id (scoped to organization)
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const section = await prisma.section.findFirst({ where: { id, organizationId: String(organizationId) } });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        return res.status(200).json(section);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'PUT':
      // Update section
      const { name } = req.body;
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const updated = await prisma.section.updateMany({ where: { id, organizationId: String(organizationId) }, data: { name } });
        if (updated.count === 0) return res.status(404).json({ error: 'Section not found or not in your organization' });
        const updatedRecord = await prisma.section.findUnique({ where: { id } });
        return res.status(200).json(updatedRecord);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'DELETE':
      // Delete section
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const deleted = await prisma.section.deleteMany({ where: { id, organizationId: String(organizationId) } });
        if (deleted.count === 0) return res.status(404).json({ error: 'Section not found or not in your organization' });
        return res.status(204).end();
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
