import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/organization';
import useTeam from 'hooks/useOrganization';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { toast } from 'react-hot-toast';
import env from '@/lib/env';
import { DirectoriesWrapper } from '@boxyhq/react-ui/dsync';
import { BOXYHQ_UI_CSS } from '@/components/styles';

const DirectorySync = ({ organizationFeatures }) => {
  const { isLoading, isError, organization } = useTeam();
  const { t } = useTranslation('common');

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
      <TeamTab
        activeTab="directory-sync"
        organization={organization}
        organizationFeatures={organizationFeatures}
      />
      <DirectoriesWrapper
        classNames={BOXYHQ_UI_CSS}
        componentProps={{
          directoryList: {
            cols: ['name', 'type', 'status', 'actions'],
            hideViewAction: true,
          },
          createDirectory: {
            excludeFields: [
              'product',
              'tenant',
              'webhook_secret',
              'webhook_url',
              'log_webhook_events',
            ],
            disableGoogleProvider: true,
          },
          editDirectory: {
            excludeFields: [
              'webhook_url',
              'webhook_secret',
              'log_webhook_events',
            ],
          },
        }}
        urls={{
          get: `/api/organizations/${organization.slug}/dsync`,
          post: `/api/organizations/${organization.slug}/dsync`,
          patch: `/api/organizations/${organization.slug}/dsync`,
          delete: `/api/organizations/${organization.slug}/dsync`,
        }}
        successCallback={({ operation }) => {
          if (operation === 'CREATE') {
            toast.success(`Connection created successfully.`);
          } else if (operation === 'UPDATE') {
            toast.success(`Connection updated successfully.`);
          } else if (operation === 'DELETE') {
            toast.success(`Connection deleted successfully.`);
          } else if (operation === 'COPY') {
            toast.success(`Contents copied to clipboard`);
          }
        }}
        errorCallback={(errMessage) => toast.error(errMessage)}
      />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.organizationFeatures.dsync) {
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

export default DirectorySync;
