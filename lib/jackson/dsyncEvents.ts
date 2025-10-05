import { DirectorySyncEvent } from '@boxyhq/saml-jackson';
import { Role } from '@prisma/client';
import { addOrganizationMember, removeOrganizationMember } from 'models/organization';
import { deleteUser, getUser, updateUser, upsertUser } from 'models/user';
import { countOrganizationMembers } from 'models/organizationMember';

// Handle SCIM events
export const handleEvents = async (event: DirectorySyncEvent) => {
  const { event: action, tenant: organizationId, data } = event;

  // Currently we only handle the user events
  // TODO: Handle group events
  if (!('email' in data)) {
    return;
  }

  const { email, first_name, last_name, active } = data;
  const name = `${first_name} ${last_name}`;

  // User has been added
  if (action === 'user.created') {
    const user = await upsertUser({
      where: {
        email,
      },
      update: {
        name,
      },
      create: {
        email,
        name,
      },
    });

    await addOrganizationMember(organizationId, user.id, Role.ADMIN);
  }

  // User has been updated
  else if (action === 'user.updated') {
    const user = await getUser({ email });

    if (!user) {
      return;
    }

    // Deactivation of user by removing them from the organization
    if (active === false) {
      await removeOrganizationMember(organizationId, user.id);

      const otherOrganizationsCount = await countOrganizationMembers({
        where: {
          userId: user.id,
        },
      });

      if (otherOrganizationsCount === 0) {
        await deleteUser({ email: user.email });
      }

      return;
    }

    await updateUser({
      where: {
        email,
      },
      data: {
        name,
      },
    });

    // Reactivation of user by adding them back to the organization
    await addOrganizationMember(organizationId, user.id, Role.ADMIN);
  }

  // User has been removed
  else if (action === 'user.deleted') {
    const user = await getUser({ email });

    if (!user) {
      return;
    }

    await removeOrganizationMember(organizationId, user.id);

    const otherOrganizationsCount = await countOrganizationMembers({
      where: {
        userId: user.id,
      },
    });

    if (otherOrganizationsCount === 0) {
      await deleteUser({ email: user.email });
    }
  }
};
