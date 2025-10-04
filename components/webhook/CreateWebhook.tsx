import type { Organization } from '@prisma/client';
import type { FormikHelpers } from 'formik';
import useWebhooks from 'hooks/useWebhooks';
import { useTranslation } from 'next-i18next';
import React from 'react';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';
import type { WebhookFormSchema } from 'types';

import ModalForm from './Form';
import { defaultHeaders } from '@/lib/common';

const CreateWebhook = ({
  visible,
  setVisible,
  organization,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  organization: Organization;
}) => {
  const { mutateWebhooks } = useWebhooks(organization.slug);
  const { t } = useTranslation('common');

  const onSubmit = async (
    values: WebhookFormSchema,
    formikHelpers: FormikHelpers<WebhookFormSchema>
  ) => {
    const response = await fetch(`/api/organizations/${organization.slug}/webhooks`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(values),
    });

    const json = (await response.json()) as ApiResponse<Organization>;

    if (!response.ok) {
      toast.error(json.error.message);
      return;
    }

    toast.success(t('webhook-created'));
    mutateWebhooks();
    setVisible(false);
    formikHelpers.resetForm();
  };

  return (
    <ModalForm
      visible={visible}
      setVisible={setVisible}
      initialValues={{
        name: '',
        url: '',
        eventTypes: [],
      }}
      onSubmit={onSubmit}
      title={t('create-webhook')}
    />
  );
};

export default CreateWebhook;
