import { Card } from '@/components/shared';
import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/organization';
import env from '@/lib/env';
import { inferSSRProps } from '@/lib/inferSSRProps';
import { getViewerToken } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import useCanAccess from 'hooks/useCanAccess';
import useTeam from 'hooks/useOrganization';
import { getOrganizationMember } from 'models/organization';
import { throwIfNotAllowed } from 'models/user';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import type { NextPageWithLayout } from 'types';

interface RetracedEventsBrowserProps {
  host: string;
  auditLogToken: string;
  header: string;
}

const RetracedEventsBrowser = dynamic<RetracedEventsBrowserProps>(
  () => import('@retracedhq/logs-viewer'),
  {
    ssr: false,
  }
);

const Events: NextPageWithLayout<inferSSRProps<typeof getServerSideProps>> = ({
  auditLogToken,
  retracedHost,
  error,
  organizationFeatures,
}) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const { isLoading, isError, organization } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError || error) {
    return <Error message={isError?.message || error?.message} />;
  }

  if (!organization) {
    return <Error message={t('organization-not-found')} />;
  }

  return (
    <>
      <TeamTab activeTab="audit-logs" organization={organization} organizationFeatures={organizationFeatures} />
      <Card>
        <Card.Body>
          {canAccess('organization_audit_log', ['read']) && auditLogToken && (
            <RetracedEventsBrowser
              host={`${retracedHost}/viewer/v1`}
              auditLogToken={auditLogToken}
              header={t('audit-logs')}
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (!env.organizationFeatures.auditLog) {
    return {
      notFound: true,
    };
  }

  const { locale, req, res, query } = context;

  const session = await getSession(req, res);
  const organizationMember = await getOrganizationMember(
    session?.user.id as string,
    query.slug as string
  );

  try {
    throwIfNotAllowed(organizationMember, 'organization_audit_log', 'read');

    const auditLogToken = await getViewerToken(
      organizationMember.organization.id,
      session?.user.id as string
    );

    return {
      props: {
        ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
        error: null,
        auditLogToken: auditLogToken ?? '',
        retracedHost: env.retraced.url ?? '',
        organizationFeatures: env.organizationFeatures,
      },
    };
  } catch (error: unknown) {
    const { message } = error as { message: string };
    return {
      props: {
        ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
        error: {
          message,
        },
        auditLogToken: null,
        retracedHost: null,
        organizationFeatures: env.organizationFeatures,
      },
    };
  }
}

export default Events;
