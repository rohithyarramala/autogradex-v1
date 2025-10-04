import { defaultHeaders, maxLengthPolicies } from '@/lib/common';
import type { Organization } from '@prisma/client';
import { useFormik } from 'formik';
import useOrganizations from 'hooks/useOrganizations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';
import * as Yup from 'yup';
import Modal from '../shared/Modal';
import { InputWithLabel } from '../shared';
import { Or } from '@prisma/client/runtime/library';

interface CreateTeamProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const CreateTeam = ({ visible, setVisible }: CreateTeamProps) => {
  const { t } = useTranslation('common');
  const { mutateOrganizations } = useOrganizations();
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required().max(maxLengthPolicies.organization),
    }),
    onSubmit: async (values) => {
      const response = await fetch('/api/organization/', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(values),
      });

      const json = (await response.json()) as ApiResponse<Organization>;

      if (!response.ok) {
        toast.error(json.error.message);
        return;
      }

      formik.resetForm();
      mutateOrganizations();
      setVisible(false);
      toast.success(t('organization-created'));
      router.push(`/organizations/${json.data.slug}/settings`);
    },
  });

  const onClose = () => {
    setVisible(false);
    router.push(`/organizations`);
  };

  return (
    <Modal open={visible} close={onClose}>
      <form onSubmit={formik.handleSubmit} method="POST">
        <Modal.Header>{t('create-organization')}</Modal.Header>
        <Modal.Description>{t('members-of-a-organization')}</Modal.Description>
        <Modal.Body>
          <InputWithLabel
            label={t('name')}
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            placeholder={t('organization-name')}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose} size="md">
            {t('close')}
          </Button>
          <Button
            type="submit"
            color="primary"
            loading={formik.isSubmitting}
            size="md"
            disabled={!formik.dirty || !formik.isValid}
          >
            {t('create-organization')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreateTeam;
