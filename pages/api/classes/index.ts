import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      // Get all classes for the current user's organization only
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const classes = await prisma.class.findMany({ where: { organizationId: String(organizationId) } });
        return res.status(200).json(classes);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'POST':
      // Create a new class (derive organizationId from session)
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required fields' });

        const newClass = await prisma.class.create({ data: { name, organizationId: String(organizationId) } });
        return res.status(201).json(newClass);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
