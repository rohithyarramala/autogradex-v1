import { useTranslation } from 'next-i18next';

import { Service, Subscription } from '@prisma/client';

interface SubscriptionsProps {
  subscriptions: (Subscription & { product: Service })[];
}

const Subscriptions = ({ subscriptions }: SubscriptionsProps) => {
  const { t } = useTranslation('common');

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="card-title text-xl font-medium leading-none tracking-tight">
        {t('subscriptions')}
      </h2>
      <table className="table w-full text-sm border">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t('plan')}</th>
            <th>{t('start-date')}</th>
            <th>{t('end-date')}</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>{subscription.id}</td>
              <td>{subscription.product.name}</td>
              <td>{subscription.currentStart ? new Date(subscription.currentStart).toLocaleDateString() : '-'}</td>
              <td>{subscription.currentEnd ? new Date(subscription.currentEnd).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Subscriptions;
