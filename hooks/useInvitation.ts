import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { useRouter } from 'next/router';
import type { ApiResponse } from 'types';
import { Invitation, Organization } from '@prisma/client';

type Response = ApiResponse<Invitation & { organization: Organization }>;

const useInvitation = (token?: string) => {
  const { query, isReady } = useRouter();

  const { data, error, isLoading } = useSWR<Response>(() => {
    const inviteToken = token || (isReady ? query.token : null);
    return inviteToken ? `/api/invitations/${inviteToken}` : null;
  }, fetcher);

  return {
    isLoading,
    error,
    invitation: data?.data,
  };
};

export default useInvitation;
