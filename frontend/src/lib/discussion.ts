export type DiscussionEntryType = 'call' | 'email' | 'note';

export interface DiscussionEntry {
  _id: string;
  opportunityId: string;
  type: DiscussionEntryType;
  content: string;
  authorId: { _id: string; firstName: string; lastName: string };
  participants: { _id: string; firstName: string; lastName: string }[];
  externalParticipants: string[];
  date: string;
  isOpenQuestion: boolean;
  resolvedAt: string | null;
  resolvedBy: { _id: string; firstName: string; lastName: string } | null;
  resolution: string | null;
  isPinned: boolean;
  attachments: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionEntryPayload {
  type: DiscussionEntryType;
  content: string;
  participants?: string[];          // registered user ObjectIds
  externalParticipants?: string[];  // free-text external names
  date: string;
  isOpenQuestion?: boolean;
}

export interface UpdateDiscussionEntryPayload {
  content?: string;
  isOpenQuestion?: boolean;
  isPinned?: boolean;
  participants?: string[];
  resolution?: string;
  resolvedBy?: string;
}

export const ENTRY_TYPE_META: Record<DiscussionEntryType, { label: string; color: string }> = {
  call:  { label: 'Call',  color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  email: { label: 'Email', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  note:  { label: 'Note',  color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const WITH_LABEL: Record<DiscussionEntryType, string> = {
  call:  'With',
  email: 'Contact',
  note:  'People involved',
};

export const WITH_PLACEHOLDER: Record<DiscussionEntryType, string> = {
  call:  'e.g. Kumar Singh · Titan Engineering',
  email: 'e.g. Kumar Singh · Titan Engineering',
  note:  'optional',
};

export const NOTES_PLACEHOLDER: Record<DiscussionEntryType, string> = {
  call:  'What was discussed? Key points and commitments…',
  email: 'Subject and key points from this email…',
  note:  'What happened, what was noted, what to remember…',
};

export function personName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}

export function formatEntryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
