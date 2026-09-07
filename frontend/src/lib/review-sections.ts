/**
 * The parts of MachineIQ a customer is asked to review after a release.
 * `path` is matched against the page a piece of feedback was sent from,
 * so each section can show what has already been reported against it.
 */
export interface ReviewSection {
  key: string;
  label: string;
  purpose: string;
  path: string;
  href: string;
  roles: string[];
}

export const reviewSections: ReviewSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    purpose: 'The overview you land on each morning. Check the figures are right and that what you need first is on it.',
    path: '/dashboard',
    href: '/dashboard',
    roles: ['admin', 'manager', 'sales', 'designer', 'leadership'],
  },
  {
    key: 'sales',
    label: 'Sales & machine projects',
    purpose: 'Raise an enquiry, quote it, confirm the order and start the machine project. Check the stages, the pricing and the reports.',
    path: '/sales',
    href: '/sales?kind=enquiry',
    roles: ['admin', 'manager', 'sales', 'leadership'],
  },
  {
    key: 'customers',
    label: 'Customers',
    purpose: 'Customer records with their sites and contacts. Check your real customers can be entered the way you file them.',
    path: '/customers',
    href: '/customers',
    roles: ['admin', 'manager', 'sales', 'leadership'],
  },
  {
    key: 'suppliers',
    label: 'Suppliers',
    purpose: 'The suppliers you buy parts and services from.',
    path: '/suppliers',
    href: '/suppliers',
    roles: ['admin', 'manager', 'leadership'],
  },
  {
    key: 'items',
    label: 'Items',
    purpose: 'Machines, parts and materials with their units and prices. Check the units and pricing match how you quote.',
    path: '/items',
    href: '/items',
    roles: ['admin', 'manager', 'designer', 'leadership'],
  },
  {
    key: 'organization',
    label: 'Organization',
    purpose: 'Your company, branches and departments as they appear on documents.',
    path: '/organization',
    href: '/organization',
    roles: ['admin', 'manager', 'leadership'],
  },
  {
    key: 'users',
    label: 'Users & access',
    purpose: 'Who can sign in, and what each role is allowed to see and change.',
    path: '/admin/users',
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    key: 'settings',
    label: 'Settings',
    purpose: 'Document numbering, currency, tax rates and approval rules.',
    path: '/admin/settings',
    href: '/admin/settings',
    roles: ['admin'],
  },
];

/** The section a piece of feedback belongs to, matched on the page it came from. */
export function sectionForPath(pagePath: string | undefined): ReviewSection | undefined {
  if (!pagePath) return undefined;
  return reviewSections.find((section) => pagePath === section.path || pagePath.startsWith(`${section.path}/`));
}

/** Link that opens a section with the feedback form already open. */
export function feedbackHref(section: ReviewSection): string {
  return `${section.href}${section.href.includes('?') ? '&' : '?'}feedback=1`;
}
