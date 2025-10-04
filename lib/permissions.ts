import { Role } from '@prisma/client';
import { name } from './zod/primitives';

type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
export type Resource =
  | 'organization'
  | 'organization_member'
  | 'organization_invitation'
  | 'organization_sso'
  | 'organization_dsync'
  | 'organization_audit_log'
  | 'organization_webhook'
  | 'organization_payments'
  | 'organization_api_key';

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.ADMIN,
    name: 'Admin',
  },
  {
    id: Role.SUPER_ADMIN,
    name:'Super ADMIN',
  },
  {
    id: Role.TEACHER,
    name: 'TEACHER',
  },
  {
    id:Role.STUDENT,
    name: 'STUDENT',
  },
];

export const permissions: RolePermissions = {
  SUPER_ADMIN: [
    {
      resource: 'organization',
      actions: '*',
    },
    {
      resource: 'organization_member',
      actions: '*',
    },
    {
      resource: 'organization_invitation',
      actions: '*',
    },
    {
      resource: 'organization_sso',
      actions: '*',
    },
    {
      resource: 'organization_dsync',
      actions: '*',
    },
    {
      resource: 'organization_audit_log',
      actions: '*',
    },
    {
      resource: 'organization_payments',
      actions: '*',
    },
    {
      resource: 'organization_webhook',
      actions: '*',
    },
    {
      resource: 'organization_api_key',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'organization',
      actions: '*',
    },
    {
      resource: 'organization_member',
      actions: '*',
    },
    {
      resource: 'organization_invitation',
      actions: '*',
    },
    {
      resource: 'organization_sso',
      actions: '*',
    },
    {
      resource: 'organization_dsync',
      actions: '*',
    },
    {
      resource: 'organization_audit_log',
      actions: '*',
    },
    {
      resource: 'organization_webhook',
      actions: '*',
    },
    {
      resource: 'organization_api_key',
      actions: '*',
    },
  ],
   
  TEACHER: [
    {
      resource: 'organization',
      actions: ['read', 'leave'],
    },
  ],
  STUDENT: [
    {
      resource: 'organization',
      actions: ['read', 'leave'],
    },
  ],
};
