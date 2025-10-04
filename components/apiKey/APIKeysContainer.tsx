import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/organization';
import useTeam from 'hooks/useOrganization';
import { useTranslation } from 'next-i18next';
import APIKeys from './APIKeys';
import { TeamFeature } from 'types';

const APIKeysContainer = ({ organizationFeatures }: { organizationFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');

  const { isLoading, isError, organization } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!organization) {
    return <Error message={t('organization-not-found')} />;
  }

  return (
    <>
      <TeamTab activeTab="api-keys" organization={organization} organizationFeatures={organizationFeatures} />
      <APIKeys organization={organization} />
    </>
  );
};

export default APIKeysContainer;
