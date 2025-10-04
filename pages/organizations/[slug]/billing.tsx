import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import env from '@/lib/env';
import useTeam from 'hooks/useOrganization';
import fetcher from '@/lib/fetcher';
import useCanAccess from 'hooks/useCanAccess';
import { TeamTab } from '@/components/organization';
import Help from '@/components/billing/Help';
import { Error, Loading } from '@/components/shared';
import LinkToPortal from '@/components/billing/LinkToPortal';
import Subscriptions from '@/components/billing/Subscriptions';
import ProductPricing from '@/components/billing/ProductPricing';

const Payments = ({ organizationFeatures }) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const { isLoading, isError, organization } = useTeam();
  const { data } = useSWR(
    organization?.slug ? `/api/organizations/${organization?.slug}/payments/products` : null,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!organization) {
    return <Error message={t('organization-not-found')} />;
  }

  const plans = data?.data?.products || [];
  const subscriptions = data?.data?.subscriptions || [];

  return (
    <>
      {canAccess('organization_payments', ['read']) && (
        <>
          <TeamTab
            activeTab="payments"
            organization={organization}
            organizationFeatures={organizationFeatures}
          />

          <div className="flex gap-6 flex-col md:flex-row">
            <LinkToPortal organization={organization} />
            <Help />
          </div>

          <div className="py-6">
            <Subscriptions subscriptions={subscriptions} />
          </div>

          <ProductPricing plans={plans} subscriptions={subscriptions} />
        </>
      )}
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.organizationFeatures.payments) {
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

export default Payments;
