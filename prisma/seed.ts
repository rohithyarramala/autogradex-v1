import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  // --- Create Super Admin ---
  const superAdminPassword = await hash('superadmin@123', 12);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@autogradex.com',
      name: 'Super Admin',
      password: superAdminPassword,
      emailVerified: new Date(),
    },
  });

  // --- Create a dummy organization for SUPER_ADMIN ---
  const superAdminOrg = await prisma.organization.create({
    data: {
      name: 'Autogradex',
      slug: 'autogradex',
      members: {
        create: {
          userId: superAdmin.id,
          role: 'SUPER_ADMIN',
        },
      },
    },
  });

  console.log('Super Admin created:', superAdmin.email);
  console.log('Fake organization created for Super Admin:', superAdminOrg.name);
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
