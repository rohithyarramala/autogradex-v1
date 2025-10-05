import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      // Get all sections for the current user's organization only
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) return res.status(401).json({ error: 'No organization found in session.' });

        const sections = await prisma.section.findMany({ where: { organizationId: String(organizationId) } });
        return res.status(200).json(sections);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
    case 'POST':
      // Create a new section. Organization is required on the Section model
      // so we must derive the organizationId from the current session.
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;

        if (!organizationId) {
          return res.status(401).json({ error: 'No organization found in session.' });
        }

        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newSection = await prisma.section.create({
          data: { name, organizationId: String(organizationId) },
        });
        return res.status(201).json(newSection);
      } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create section: ' + (error?.message || String(error)) });
      }
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
