import { Error, Loading } from '@/components/shared';
import { AccessControl } from '@/components/shared/AccessControl';
import { RemoveTeam, TeamSettings, TeamTab } from '@/components/organization';
import env from '@/lib/env';
import useOrganization from 'hooks/useOrganization';
import type { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { TeamFeature } from 'types';
import { use } from 'react';

const Settings = ({ organizationFeatures }: { organizationFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, organization } = useOrganization();

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
      <TeamTab activeTab="settings" organization={organization} organizationFeatures={organizationFeatures} />
      <div className="space-y-6">
        <TeamSettings organization={organization} />
        <AccessControl resource="organization" actions={['delete']}>
          <RemoveTeam organization={organization} allowDelete={organizationFeatures.deleteTeam} />
        </AccessControl>
      </div>
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      organizationFeatures: env.organizationFeatures,
    },
  };
}

export default Settings;
