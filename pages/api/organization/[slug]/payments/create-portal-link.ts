import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/lib/session';
import { throwIfNoOrganizationAccess } from 'models/organization';
import { stripe, getStripeCustomerId } from '@/lib/stripe';
import env from '@/lib/env';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
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

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const organizationMember = await throwIfNoOrganizationAccess(req, res);
  const session = await getSession(req, res);
  const customerId = await getStripeCustomerId(organizationMember, session);

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.appUrl}/organizations/${organizationMember.organization.slug}/billing`,
  });

  res.json({ data: { url } });
};
