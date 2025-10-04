import { sendAudit } from '@/lib/retraced';
import {
  deleteOrganization,
  getCurrentUserWithTeam,
  getOrganization,
  throwIfNoOrganizationAccess,
  updateOrganization,
} from 'models/organization';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { ApiError } from '@/lib/errors';
import env from '@/lib/env';
import { updateTeamSchema, validateWithSchema } from '@/lib/zod';
import { Prisma, Organization } from '@prisma/client';
import { get } from 'http';
import { Or } from '@prisma/client/runtime/library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await throwIfNoOrganizationAccess(req, res);

    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get a organization by slug
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'organization', 'read');

  const organization = await getOrganization({ id: user.organization.id });

  recordMetric('organization.fetched');

  res.status(200).json({ data: organization });
};

// Update a organization
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'organization', 'update');

  const { name, slug, domain } = validateWithSchema(updateTeamSchema, req.body);

  let updatedTeam: Organization | null = null;

  try {
    updatedTeam = await updateOrganization(user.organization.slug, {
      name,
      slug,
      domain,
    });
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta?.target
    ) {
      const target = error.meta.target as string[];

      if (target.includes('slug')) {
        throw new ApiError(409, 'This slug is already taken for a organization.');
      }

      if (target.includes('domain')) {
        throw new ApiError(
          409,
          'This domain is already associated with a organization.'
        );
      }
    }

    throw error;
  }

  sendAudit({
    action: 'organization.update',
    crud: 'u',
    user,
    organization: user.organization,
  });

  recordMetric('organization.updated');

  res.status(200).json({ data: updatedTeam });
};

// Delete a organization
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!env.organizationFeatures.deleteTeam) {
    throw new ApiError(404, 'Not Found');
  }

  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'organization', 'delete');

  await deleteOrganization({ id: user.organization.id });

  sendAudit({
    action: 'organization.delete',
    crud: 'd',
    user,
    organization: user.organization,
  });

  recordMetric('organization.removed');

  res.status(204).end();
};
