import {
  RectangleStackIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  LifebuoyIcon,
  ChartPieIcon,
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

  if (role === 'SUPER_ADMIN') {
    menus.unshift(
      {
        name: t('dashboard'),
        href: '/dashboard',
        icon: HomeIcon,
        active: activePathname === '/dashboard',
      },
      {
        name: t('organisations'),
        href: '/organisations',
        icon: BuildingOfficeIcon,
        active: activePathname === '/organisations',
      },
      {
        name: t('user_management'),
        href: '/users',
        icon: UsersIcon,
        active: activePathname === '/users',
      },
      {
        name: t('subscriptions_and_plans'),
        href: '/subscriptions',
        icon: ClipboardDocumentListIcon,
        active: activePathname === '/subscriptions',
      },
      {
        name: t('billing_and_payments'),
        href: '/billing',
        icon: CreditCardIcon,
        active: activePathname === '/billing',
      },
      {
        name: t('usage_and_reports'),
        href: '/reports',
        icon: ChartBarIcon,
        active: activePathname === '/reports',
      },
      {
        name: t('system_settings'),
        href: '/settings',
        icon: Cog6ToothIcon,
        active: activePathname === '/settings',
      },
      {
        name: t('admin_accounts'),
        href: '/admins',
        icon: ShieldCheckIcon,
        active: activePathname === '/admins',
      },
      {
        name: t('audit_and_logs'),
        href: '/audit',
        icon: ClipboardDocumentCheckIcon,
        active: activePathname === '/audit',
      },
      {
        name: t('support_and_feedback'),
        href: '/support',
        icon: LifebuoyIcon,
        active: activePathname === '/support',
      },
      {
        name: t('insights'),
        href: '/insights',
        icon: ChartPieIcon,
        active: activePathname === '/insights',
      }
    );
  }

  if (role === 'ADMIN' || role === 'TEACHER') {
    menus.unshift(
      {
        name: t('Classes'),
        href: '/classes',
        icon: BookOpenIcon,
        active: activePathname === '/classes',
      },
      {
        name: t('Sections'),
        href: '/sections',
        icon: RectangleStackIcon,
        active: activePathname === '/sections',
      },
      {
        name: t('Subjects'),
        href: '/subjects',
        icon: AcademicCapIcon,
        active: activePathname === '/subjects',
      },
      {
        name: t('Students'),
        href: '/students',
        icon: UserGroupIcon,
        active: activePathname === '/students',
      },
      {
        name: t('AI Evaluations'),
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
      name: t('Teachers'),
      href: '/teachers',
      icon: BookOpenIcon,
      active: activePathname === '/teachers',
    });
  }

  return <NavigationItems menus={menus} />;
};

export default UserNavigation;
