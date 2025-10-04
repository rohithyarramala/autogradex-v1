import { Card, InputWithLabel } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import { Organization } from '@prisma/client';
import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';

import { AccessControl } from '../shared/AccessControl';
import { z } from 'zod';
import { updateTeamSchema } from '@/lib/zod';
import useTeams from 'hooks/useOrganizations';
import useOrganizations from 'hooks/useOrganizations';

const TeamSettings = ({ organization }: { organization: Organization }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { mutateOrganizations } = useOrganizations();

  const formik = useFormik<z.infer<typeof updateTeamSchema>>({
    initialValues: {
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain || '',
    },
    validateOnBlur: false,
    enableReinitialize: true,
    validate: (values) => {
      try {
        updateTeamSchema.parse(values);
      } catch (error: any) {
        return error.formErrors.fieldErrors;
      }
    },
    onSubmit: async (values) => {
      const response = await fetch(`/api/organizations/${organization.slug}`, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(values),
      });

      const json = (await response.json()) as ApiResponse<Organization>;

      if (!response.ok) {
        toast.error(json.error.message);
        return;
      }

      toast.success(t('successfully-updated'));
      mutateOrganizations();
      router.push(`/organizations/${json.data.slug}/settings`);
    },
  });

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <Card>
          <Card.Body>
            <Card.Header>
              <Card.Title>{t('organization-settings')}</Card.Title>
              <Card.Description>{t('organization-settings-config')}</Card.Description>
            </Card.Header>
            <div className="flex flex-col gap-4">
              <InputWithLabel
                name="name"
                label={t('organization-name')}
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.errors.name}
              />
              <InputWithLabel
                name="slug"
                label={t('organization-slug')}
                value={formik.values.slug}
                onChange={formik.handleChange}
                error={formik.errors.slug}
              />
              <InputWithLabel
                name="domain"
                label={t('organization-domain')}
                value={formik.values.domain ? formik.values.domain : ''}
                onChange={formik.handleChange}
                error={formik.errors.domain}
              />
            </div>
          </Card.Body>
          <AccessControl resource="organization" actions={['update']}>
            <Card.Footer>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  color="primary"
                  loading={formik.isSubmitting}
                  disabled={!formik.isValid || !formik.dirty}
                  size="md"
                >
                  {t('save-changes')}
                </Button>
              </div>
            </Card.Footer>
          </AccessControl>
        </Card>
      </form>
    </>
  );
};

export default TeamSettings;
