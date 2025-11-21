import { prisma } from '@/lib/prisma';
import { Subscription } from '@prisma/client';

export const createSubscription = async ({
  id,
  organizationId,
  planId,
  status,
  currentStart,
  currentEnd,
  notes,
}: {
  id: string;
  organizationId: string;
  planId: string;
  status?: string;
  currentStart?: Date;
  currentEnd?: Date;
  notes?: any;
}) => {
  return prisma.subscription.create({
    data: {
      id,
      organizationId,
      planId,
      status,
      currentStart,
      currentEnd,
      notes,
    },
  });
};

export const deleteStripeSubscription = async (id: string) => {
  return await prisma.subscription.deleteMany({
    where: {
      id,
    },
  });
};

export const updateStripeSubscription = async (id: string, data: any) => {
  return await prisma.subscription.update({
    where: {
      id,
    },
    data,
  });
};

export const getByOrganizationId = async (organizationId: string) => {
  return prisma.subscription.findMany({
    where: {
      organizationId,
    },
  });
};


export const getBySubscriptionId = async (
  subscriptionId: string
): Promise<Subscription | null> => {
  return await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
  });
};
