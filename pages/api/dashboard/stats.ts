import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const session = await getSession(req, res);
        const organizationId = session?.user?.organizationId;
        if (!organizationId) {
          return res.status(401).json({ error: 'No organization found in session.' });
        }

        // Parallel execution for performance
        const [classCount, sectionCount, teacherCount,studentCount, aiEvalCount] = await Promise.all([
          prisma.class.count({ where: { organizationId: String(organizationId) } }),
          prisma.section.count({ where: { organizationId: String(organizationId) } }),
          prisma.user.count({
            where: {
              organizationMember: {
                some: { role: 'TEACHER', organizationId: String(organizationId) },
              },
            },
          }),
          prisma.user.count({
            where: {
              organizationMember: {
                some: { role: 'STUDENT', organizationId: String(organizationId) },
              },
            },
          }),
          prisma.evaluation.count({ where: { organizationId: String(organizationId) } }),
        ]);

        return res.status(200).json({
          stats: {
            classes: classCount,
            sections: sectionCount,
            teachers: teacherCount,
            students: studentCount,
            aiEvaluations: aiEvalCount,
          },
        });
      } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ error: error?.message || 'Internal Server Error' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
