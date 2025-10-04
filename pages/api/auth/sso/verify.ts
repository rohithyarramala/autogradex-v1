import env from '@/lib/env';
import { ssoManager } from '@/lib/jackson/sso';
import { ssoVerifySchema, validateWithSchema } from '@/lib/zod';
import { Organization } from '@prisma/client';
import { Or } from '@prisma/client/runtime/library';
import { getOrganization, getOrganizations } from 'models/organization';
import { getUser } from 'models/user';
import { NextApiRequest, NextApiResponse } from 'next';
import { get } from 'node:http';

const sso = ssoManager();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (err: any) {
    res.status(400).json({
      error: { message: err.message },
    });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, email } = validateWithSchema(
    ssoVerifySchema,
    JSON.parse(req.body) as { slug: string }
  );

  if (!slug && !email) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // If slug is provided, verify SSO connections for the organization
  if (slug) {
    const organization = await getOrganization({ slug });

    if (!organization) {
      throw new Error('Team not found.');
    }

    const data = await handleTeamSSOVerification(organization.id);
    return res.json({ data });
  }

  // If email is provided, verify SSO connections for the user
  if (email) {
    const organizations = await getTeamsFromEmail(email);

    if (organizations.length === 1) {
      const data = await handleTeamSSOVerification(organizations[0].id);
      return res.json({ data });
    }

    const { organizationId, useSlug } = await processTeamsForSSOVerification(organizations);

    // Multiple organizations with SSO connections found
    // Ask user to provide organization slug
    if (useSlug) {
      return res.json({
        data: {
          useSlug,
        },
      });
    }

    // No organizations with SSO connections found
    if (!organizationId) {
      throw new Error('No SSO connections found for any organization.');
    } else {
      // Only one organization with SSO connections found
      return res.json({
        data: {
          organizationId,
        },
      });
    }
  }
};

/**
 * Handle SSO verification for given organization id
 */
async function handleTeamSSOVerification(organizationId: string) {
  const exists = await organizationSSOExists(organizationId);

  if (!exists) {
    throw new Error('No SSO connections found for this organization.');
  }

  return { organizationId };
}

/**
 * Get list of organizations for a user from email
 */
async function getTeamsFromEmail(email: string): Promise<Organization[]> {
  const user = await getUser({ email });
  if (!user) {
    throw new Error('User not found.');
  }
  const organizations = await getOrganizations(user.id);
  if (!organizations.length) {
    throw new Error('User does not belong to any organization.');
  }
  return organizations;
}

/**
 * Check if SSO connections exist for a organization
 */
async function organizationSSOExists(organizationId: string): Promise<boolean> {
  const connections = await sso.getConnections({
    tenant: organizationId,
    product: env.jackson.productId,
  });

  if (connections && connections.length > 0) {
    return true;
  }

  return false;
}

/**
 * Process organizations to find the organization with SSO connections
 * If multiple organizations with SSO connections are found, return useSlug as true
 * If no organizations with SSO connections are found, return organizationId as empty string
 * If only one organization with SSO connections is found, return organizationId
 */
async function processTeamsForSSOVerification(organizations: Organization[]): Promise<{
  organizationId: string;
  useSlug: boolean;
}> {
  let organizationId = '';
  for (const organization of organizations) {
    const exists = await organizationSSOExists(organization.id);

    if (exists) {
      if (organizationId) {
        // Multiple organizations with SSO connections found
        return {
          organizationId: '',
          useSlug: true,
        };
      } else {
        // First organization with SSO connections found
        organizationId = organization.id;
      }
    }
  }
  return {
    organizationId,
    useSlug: false,
  };
}
