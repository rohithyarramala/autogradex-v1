import {
  ChevronUpDownIcon,
  FolderIcon,
  FolderPlusIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import useOrganizations from 'hooks/useOrganizations';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { maxLengthPolicies } from '@/lib/common';

const TeamDropdown = () => {
  const router = useRouter();
  const { organizations } = useOrganizations();
  const { data } = useSession();
  const { t } = useTranslation('common');

  const role = data?.user?.role || 'STUDENT'; // default fallback

  console.log('User Role:', role); // Debugging line to check the role value
  const currentTeam = (organizations || []).find(
    (organization) => organization.slug === router.query.slug
  );

  /** =================== Menus Based on Role =================== */
  const menus = React.useMemo(() => {
    const baseMenus = [
      {
        id: 1,
        name: t('profile'),
        items: [
          {
            id: data?.user.id,
            name: data?.user?.name,
            href: '/settings/account',
            icon: UserCircleIcon,
          },
        ],
      },
    ];
    //  const baseMenus = [
    //   {
    //     id: 1,
    //     name: t('profile'),
    //     items: [
    //       {
    //         id: data?.user.id,
    //         name: data?.user?.name,
    //         href: '/settings/account',
    //         icon: UserCircleIcon,
    //       },
    //     ],
    //   },
    // ];

    if (role === 'SUPER_ADMIN') {
         baseMenus.push({
        id: 2,
        name: t('Organization'),
        items: (organizations || []).map((organization) => ({
          id: organization.id,
          name: organization.name,
          href: `/organizations/${organization.slug}/products`,
          icon: FolderIcon,
        })),
      });
    } else if (role === 'ADMIN') {
      baseMenus.push({
        id: 2,
        name: t('Organization'),
        items: (organizations || []).map((organization) => ({
          id: organization.id,
          name: organization.name,
          href: `/organizations/${organization.slug}/products`,
          icon: FolderIcon,
        })),
      });
    } else if (role === 'TEACHER') {
      baseMenus.push({
        id: 2,
        name: t('Menu'),
        items: (organizations || []).map((organization) => ({
          id: organization.id,
          name: `Acadamics`,
          href: `/acadamics/${organization.slug}/classes`,
          icon: RectangleStackIcon,
        })),
      });
    } else {
      // STUDENT or other roles
      baseMenus.push({
        id: 2,
        name: t('Menu'),
        items: (organizations || []).map((organization) => ({
          id: organization.id,
          name: `Acadamics`,
          href: `/acadamics/${organization.slug}/assignments`,
          icon: FolderPlusIcon,
        })),
      });
    }

    return baseMenus;
  }, [role, organizations, data, t]);

  /** =================== Render Dropdown =================== */
  return (
    <div className="dropdown w-full">
      <div
        tabIndex={0}
        className="border border-gray-300 dark:border-gray-600 flex h-10 items-center px-4 justify-between cursor-pointer rounded text-sm font-bold"
      >
        {currentTeam?.name ||
          data?.user?.name?.substring(0, maxLengthPolicies.nameShortDisplay)}{' '}
        <ChevronUpDownIcon className="w-5 h-5" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content dark:border-gray-600 p-2 shadow-md bg-base-100 w-full rounded border px-2"
      >
        {menus.map(({ id, name, items }) => (
          <React.Fragment key={id}>
            {name && (
              <li className="text-xs text-gray-500 py-1 px-2">{name}</li>
            )}
            {items.map((item) => (
              <li
                key={`${id}-${item.id}`}
                onClick={() => {
                  if (document.activeElement) {
                    (document.activeElement as HTMLElement).blur();
                  }
                }}
              >
                <Link href={item.href}>
                  <div className="flex hover:bg-gray-100 hover:dark:text-black focus:bg-gray-100 focus:outline-none py-2 px-2 rounded text-sm font-medium gap-2 items-center">
                    <item.icon className="w-5 h-5" /> {item.name}
                  </div>
                </Link>
              </li>
            ))}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default TeamDropdown;
