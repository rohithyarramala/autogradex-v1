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
          class: true,
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
      // optional roll number stored on the user model
      ...(data.rollNo ? { rollNo: data.rollNo } : {}),
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
        classId: data.classId,
      },
    });
  }
  return user;
};

export const updateStudent = async (id: string, data: any) => {
  // Only update allowed user fields
  const updateData: any = {};
  if (typeof data.name === 'string') updateData.name = data.name;
  if (typeof data.email === 'string') updateData.email = data.email;
  if (typeof data.password === 'string') updateData.password = data.password;
  if (typeof data.rollNo === 'string') updateData.rollNo = data.rollNo;

  const user = await prisma.user.update({ where: { id }, data: updateData });

  // If sectionId provided, replace existing enrollments with the new one
  if (data.sectionId) {
    await prisma.studentEnrollment.deleteMany({ where: { studentId: id } });
    await prisma.studentEnrollment.create({ data: { studentId: id, sectionId: data.sectionId, classId: data.classId} });
  }

  return user;
};

export const deleteStudent = async (id: string) => {
  return await prisma.user.delete({
    where: { id },
  });
};
