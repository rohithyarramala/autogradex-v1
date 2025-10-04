import {
  RectangleStackIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';

interface UserNavigationProps extends NavigationProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN';
}

const UserNavigation = ({ activePathname, role }: UserNavigationProps) => {
  const { t } = useTranslation('common');

  /** =================== Role-Based Menu =================== */
  const menus: MenuItem[] = [];

  // All users have Account & Security
  menus.push(
    {
      name: t('account'),
      href: '/settings/account',
      icon: UserCircleIcon,
      active: activePathname === '/settings/account',
    },
    {
      name: t('security'),
      href: '/settings/security',
      icon: ShieldCheckIcon,
      active: activePathname === '/settings/security',
    }
  );

  if (role === 'ADMIN' || role === 'TEACHER') {
    menus.unshift(
      {
        name: t('classes'),
        href: '/classes',
        icon: BookOpenIcon,
        active: activePathname === '/classes',
      },
      {
        name: t('sections'),
        href: '/sections',
        icon: RectangleStackIcon,
        active: activePathname === '/sections',
      },
      {
        name: t('subjects'),
        href: '/subjects',
        icon: AcademicCapIcon,
        active: activePathname === '/subjects',
      },
      {
        name: t('students'),
        href: '/students',
        icon: UserGroupIcon,
        active: activePathname === '/students',
      },
      {
        name: t('ai-evaluations'),
        href: '/ai-evaluations',
        icon: ChartBarIcon,
        active: activePathname === '/ai-evaluations',
      }
    );
  }

  if (role === 'STUDENT') {
    menus.unshift({
      name: t('my-classes'),
      href: '/my-classes',
      icon: BookOpenIcon,
      active: activePathname === '/my-classes',
    });
  }

  if (role === 'ADMIN') {
    menus.unshift({
      name: t('teachers'),
      href: '/teachers',
      icon: BookOpenIcon,
      active: activePathname === '/teachers',
    });
  }

  return <NavigationItems menus={menus} />;
};

export default UserNavigation;
