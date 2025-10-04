import APIKeysContainer from '@/components/apiKey/APIKeysContainer';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';

const APIKeys = ({ organizationFeatures }) => {
  return <APIKeysContainer organizationFeatures={organizationFeatures} />;
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.organizationFeatures.apiKey) {
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

export default APIKeys;
