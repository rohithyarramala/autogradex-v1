import { ApiError } from '../errors';
import { dsyncManager } from '@/lib/jackson/dsync/index';

type GuardOptions = {
  organizationId: string;
  directoryId: string;
};

// Throw if the user is not allowed to access given Directory connection.
export const throwIfNoAccessToDirectory = async ({
  organizationId,
  directoryId,
}: GuardOptions) => {
  if (!directoryId) {
    return;
  }

  const dsync = dsyncManager();

  const { data: connection } = await dsync.getConnectionById(directoryId);

  if (connection.tenant === organizationId) {
    return;
  }

  throw new ApiError(
    403,
    `Forbidden. You don't have access to this directory connection.`
  );
};
