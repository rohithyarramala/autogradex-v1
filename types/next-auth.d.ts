import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN';
      roles: { organizationId: string; role: Role }[];
      organizationId?: string | null;

    };
  }

  interface Profile {
    requested: {
      tenant: string;
    };
    roles: string[];
    groups: string[];
  }
}
