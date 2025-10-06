import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      // Get all teachers
      // Get all teachers by joining OrganizationMember with role TEACHER
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId)
          return res
            .status(401)
            .json({ error: 'No organization found in session.' });

        const teachers = await prisma.user.findMany({
          where: {
            organizationMember: {
              some: { role: 'TEACHER', organizationId: String(organizationId) },
            },
          },
        });
        return res.status(200).json(teachers);
      } catch (error: any) {
        return res.status(500).json({ error: error?.message || String(error) });
      }
      const session = await getSession(req, res);

    case 'POST':
      // Create a new teacher
      const { name, email, password, organizationId } = req.body;

      if (!name || !email || !password || !organizationId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      try {
        // Create user

        const encrypted_password = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { name, email, password: encrypted_password },
        });
        // Add to OrganizationMember with role TEACHER
        await prisma.organizationMember.create({
          data: {
            organizationId,
            userId: user.id,
            role: 'TEACHER',
          },
        });
        return res.status(201).json(user);
      } catch (error) {
        return res
          .status(500)
          .json({ error: 'Failed to create teacher' + error });
      }
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
