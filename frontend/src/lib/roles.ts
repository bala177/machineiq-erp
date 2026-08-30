export const ROLE_DEFINITIONS = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'Full system access: users, roles, departments, settings, and all workflow data.',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    key: 'manager',
    label: 'Manager',
    description: 'Responsible for overall projects: conversion, kickoff, milestones, assignments, and delivery health.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    key: 'sales',
    label: 'Sales',
    description: 'Create machine inquiries, maintain intake details, and follow customer request status.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    key: 'designer',
    label: 'Designer',
    description: 'Work on assigned engineering tasks, machines, components, reviews, blockers, and design release.',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  },
  {
    key: 'leadership',
    label: 'Leadership',
    description: 'Read clear dashboards, reports, escalations, and project health without operational edit controls.',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
] as const;

export type RoleKey = (typeof ROLE_DEFINITIONS)[number]['key'];

export const ROLE_KEYS = ROLE_DEFINITIONS.map((role) => role.key);

export function roleLabel(role: string) {
  return ROLE_DEFINITIONS.find((item) => item.key === role)?.label ?? role.replace(/_/g, ' ');
}

export function roleColor(role: string) {
  return ROLE_DEFINITIONS.find((item) => item.key === role)?.color ?? 'bg-surface-tertiary text-fg-tertiary';
}
