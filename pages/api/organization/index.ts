import { slugify } from '@/lib/server-common';
import { ApiError } from '@/lib/errors';
import { createOrganization, getOrganizations, isOrganizationExists } from 'models/organization';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { createTeamSchema, validateWithSchema } from '@/lib/zod';
import { getCurrentUser } from 'models/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get organizations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUser(req, res);
  const organizations = await getOrganizations(user.id);

  recordMetric('organization.fetched');

  res.status(200).json({ data: organizations });
};

// Create a organization
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = validateWithSchema(createTeamSchema, req.body);

  const user = await getCurrentUser(req, res);
  const slug = slugify(name);

  if (await isOrganizationExists(slug)) {
    throw new ApiError(400, 'A organization with the slug already exists.');
  }

  const organization = await createOrganization({
    userId: user.id,
    name,
    slug,
  });

  recordMetric('organization.created');

  res.status(200).json({ data: organization });
};
