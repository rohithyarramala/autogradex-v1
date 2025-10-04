import { Role } from '@prisma/client';
import { ApiError } from './errors';
import { getOrganizationMember } from 'models/organization';

export async function validateMembershipOperation(
  memberId: string,
  organizationMember,
  operationMeta?: {
    role?: Role;
  }
) {
  const updatingMember = await getOrganizationMember(memberId, organizationMember.organization.slug);
  // Member and Admin can't update the role of Owner
  if (
    (organizationMember.role === Role.TEACHER || organizationMember.role === Role.ADMIN) &&
    updatingMember.role === Role.TEACHER
  ) {
    throw new ApiError(
      403,
      'You do not have permission to update the role of this member.'
    );
  }
  // Member can't update the role of Admin & Owner
  if (
    organizationMember.role === Role.TEACHER &&
    (updatingMember.role === Role.ADMIN || updatingMember.role === Role.TEACHER)
  ) {
    throw new ApiError(
      403,
      'You do not have permission to update the role of this member.'
    );
  }

  // Admin can't make anyone an Owner
  if (organizationMember.role === Role.ADMIN && operationMeta?.role === Role.TEACHER) {
    throw new ApiError(
      403,
      'You do not have permission to update the role of this member to Owner.'
    );
  }

  // Member can't make anyone an Admin or Owner
  if (
    organizationMember.role === Role.TEACHER &&
    (operationMeta?.role === Role.ADMIN || operationMeta?.role === Role.TEACHER)
  ) {
    throw new ApiError(
      403,
      'You do not have permission to update the role of this member to Admin.'
    );
  }
}
