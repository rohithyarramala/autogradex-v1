import { prisma } from '@/lib/prisma';

export const user = {
  name: 'Jackson',
  email: 'jackson@example.com',
  password: 'password',
} as const;

export const organization = {
  name: 'Example',
  slug: 'example',
} as const;

export const secondTeam = {
  name: 'BoxyHQ',
  slug: 'boxyhq',
} as const;

export async function cleanup() {
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();
  await prisma.$disconnect();
}
