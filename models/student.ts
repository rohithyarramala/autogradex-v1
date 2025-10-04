import { prisma } from '@/lib/prisma';

export const getStudents = async (organizationId: string) => {
  // Get all students enrolled in sections belonging to this organization
  return await prisma.user.findMany({
    where: {
      organizationMember: {
        some: {
          organizationId: organizationId,
          role: 'STUDENT',
        },
      },
    },
    include: {
      studentEnrollments: {
        include: {
          section: true,
        },
      },
    },
  });
};

export const createStudent = async (data: any, organizationId: string) => {
  // Create user with STUDENT role and enroll in section
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      organizationMember: {
        create: [{ organizationId: organizationId, role: 'STUDENT' }],
      },
    },
  });
  if (data.sectionId) {
    await prisma.studentEnrollment.create({
      data: {
        studentId: user.id,
        sectionId: data.sectionId,
      },
    });
  }
  return user;
};

export const updateStudent = async (id: string, data: any) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteStudent = async (id: string) => {
  return await prisma.user.delete({
    where: { id },
  });
};
