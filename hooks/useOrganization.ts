import fetcher from '@/lib/fetcher';
import type { Organization } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { ApiResponse } from 'types';

const useOrganization = (slug?: string) => {
  const { query, isReady } = useRouter();

  const organizationSlug = slug || (isReady ? query.slug : null);

  const { data, error, isLoading } = useSWR<ApiResponse<Organization>>(
    organizationSlug ? `/api/organization/${organizationSlug}` : null,
    fetcher
  );

  return {
    isLoading,
    isError: error,
    organization: data?.data,
  };
};

export default useOrganization;
