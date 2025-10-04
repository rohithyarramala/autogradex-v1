import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/organization';
import { Webhooks } from '@/components/webhook';
import useTeam from 'hooks/useOrganization';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';

const WebhookList = ({ organizationFeatures }) => {
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
      <TeamTab activeTab="webhooks" organization={organization} organizationFeatures={organizationFeatures} />
      <Webhooks organization={organization} />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.organizationFeatures.webhook) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      organizationFeatures: env.organizationFeatures,
    },
  };
}

export default WebhookList;
