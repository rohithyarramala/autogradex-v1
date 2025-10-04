import Stripe from 'stripe';
import env from '@/lib/env';
import { updateOrganization } from 'models/organization';

export const stripe = new Stripe(env.stripe.secretKey ?? '');

export async function getStripeCustomerId(organizationMember, session?: any) {
  let customerId = '';
  if (!organizationMember.organization.billingId) {
    const customerData: {
      metadata: { organizationId: string };
      email?: string;
    } = {
      metadata: {
        organizationId: organizationMember.organizationId,
      },
    };
    if (session?.user?.email) {
      customerData.email = session?.user?.email;
    }
    const customer = await stripe.customers.create({
      ...customerData,
      name: session?.user?.name as string,
    });
    await updateOrganization(organizationMember.organization.slug, {
      billingId: customer.id,
      billingProvider: 'stripe',
    });
    customerId = customer.id;
  } else {
    customerId = organizationMember.organization.billingId;
  }
  return customerId;
}
