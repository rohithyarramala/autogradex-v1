import { Card } from '@/components/shared';
import { Organization } from '@prisma/client';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';

import ConfirmationDialog from '../shared/ConfirmationDialog';
import { defaultHeaders } from '@/lib/common';
import type { ApiResponse } from 'types';

interface RemoveTeamProps {
  organization: Organization;
  allowDelete: boolean;
}

const RemoveTeam = ({ organization, allowDelete }: RemoveTeamProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [askConfirmation, setAskConfirmation] = useState(false);

  const removeTeam = async () => {
    setLoading(true);

    const response = await fetch(`/api/organizations/${organization.slug}`, {
      method: 'DELETE',
      headers: defaultHeaders,
    });

    setLoading(false);

    if (!response.ok) {
      const json = (await response.json()) as ApiResponse;
      toast.error(json.error.message);
      return;
    }

    toast.success(t('organization-removed-successfully'));
    router.push('/organizations');
  };

  return (
    <>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('remove-organization')}</Card.Title>
            <Card.Description>
              {allowDelete
                ? t('remove-organization-warning')
                : t('remove-organization-restricted')}
            </Card.Description>
          </Card.Header>
        </Card.Body>
        {allowDelete && (
          <Card.Footer>
            <Button
              color="error"
              onClick={() => setAskConfirmation(true)}
              loading={loading}
              variant="outline"
              size="md"
            >
              {t('remove-organization')}
            </Button>
          </Card.Footer>
        )}
      </Card>
      {allowDelete && (
        <ConfirmationDialog
          visible={askConfirmation}
          title={t('remove-organization')}
          onCancel={() => setAskConfirmation(false)}
          onConfirm={removeTeam}
        >
          {t('remove-organization-confirmation')}
        </ConfirmationDialog>
      )}
    </>
  );
};

export default RemoveTeam;
