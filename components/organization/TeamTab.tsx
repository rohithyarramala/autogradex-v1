import {
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
  PaperAirplaneIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import type { Organization } from '@prisma/client';
import classNames from 'classnames';
import useCanAccess from 'hooks/useCanAccess';
import Link from 'next/link';
import { TeamFeature } from 'types';

interface TeamTabProps {
  activeTab: string;
  organization: Organization;
  heading?: string;
  organizationFeatures: TeamFeature;
}

const TeamTab = ({ activeTab, organization, heading, organizationFeatures }: TeamTabProps) => {
  const { canAccess } = useCanAccess();

  const navigations = [
    {
      name: 'Settings',
      href: `/organizations/${organization.slug}/settings`,
      active: activeTab === 'settings',
      icon: Cog6ToothIcon,
    },
  ];

  if (canAccess('organization_member', ['create', 'update', 'read', 'delete'])) {
    navigations.push({
      name: 'Members',
      href: `/organizations/${organization.slug}/members`,
      active: activeTab === 'members',
      icon: UserPlusIcon,
    });
  }

  if (
    organizationFeatures.sso &&
    canAccess('organization_sso', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Single Sign-On',
      href: `/organizations/${organization.slug}/sso`,
      active: activeTab === 'sso',
      icon: ShieldExclamationIcon,
    });
  }

  if (
    organizationFeatures.dsync &&
    canAccess('organization_dsync', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Directory Sync',
      href: `/organizations/${organization.slug}/directory-sync`,
      active: activeTab === 'directory-sync',
      icon: UserPlusIcon,
    });
  }

  if (
    organizationFeatures.auditLog &&
    canAccess('organization_audit_log', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Audit Logs',
      href: `/organizations/${organization.slug}/audit-logs`,
      active: activeTab === 'audit-logs',
      icon: DocumentMagnifyingGlassIcon,
    });
  }

  if (
    organizationFeatures.payments &&
    canAccess('organization_payments', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Billing',
      href: `/organizations/${organization.slug}/billing`,
      active: activeTab === 'payments',
      icon: BanknotesIcon,
    });
  }

  if (
    organizationFeatures.webhook &&
    canAccess('organization_webhook', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'Webhooks',
      href: `/organizations/${organization.slug}/webhooks`,
      active: activeTab === 'webhooks',
      icon: PaperAirplaneIcon,
    });
  }

  if (
    organizationFeatures.apiKey &&
    canAccess('organization_api_key', ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: 'API Keys',
      href: `/organizations/${organization.slug}/api-keys`,
      active: activeTab === 'api-keys',
      icon: KeyIcon,
    });
  }

  return (
    <div className="flex flex-col pb-6">
      <h2 className="text-xl font-semibold mb-2">
        {heading ? heading : organization.name}
      </h2>
      <nav
        className=" flex flex-wrap border-b border-gray-300"
        aria-label="Tabs"
      >
        {navigations.map((menu) => {
          return (
            <Link
              href={menu.href}
              key={menu.href}
              className={classNames(
                'inline-flex items-center border-b-2 py-2 md-py-4 mr-5 text-sm font-medium',
                menu.active
                  ? 'border-gray-900 text-gray-700 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300  hover:text-gray-700 hover:dark:text-gray-100'
              )}
            >
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default TeamTab;
