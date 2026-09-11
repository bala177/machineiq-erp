export type FeedbackType = 'broken' | 'hard_to_use' | 'suggestion' | 'general' | 'positive';
export type FeedbackUrgency = 'blocking' | 'important' | 'minor';
export type FeedbackStatus = 'new' | 'reviewing' | 'needs_info' | 'planned' | 'fixed' | 'wont_fix' | 'closed';

export interface FeedbackRecord {
  _id: string;
  type: FeedbackType;
  urgency: FeedbackUrgency;
  status: FeedbackStatus;
  message: string;
  contactAllowed: boolean;
  pagePath: string;
  pageTitle?: string;
  appVersion?: string;
  gitCommit?: string;
  browser?: string;
  deviceType?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  recentApiError?: { path?: string; status?: number; message?: string; at?: string };
  screenshotDataUrl?: string;
  customerResponse?: string;
  internalNotes?: string;
  assigneeId?: string;
  assignee?: { _id: string; firstName: string; lastName: string; email: string };
  submitter?: { _id: string; firstName: string; lastName: string; email: string; role: string };
  targetRelease?: string;
  duplicateOfId?: string;
  createdAt: string;
  updatedAt: string;
}

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  broken: 'Something is broken', hard_to_use: 'Hard to use', suggestion: 'Suggestion', general: 'General feedback', positive: 'Works well',
};
export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  new: 'New', reviewing: 'Reviewing', needs_info: 'Needs info', planned: 'Planned', fixed: 'Fixed', wont_fix: "Won't fix", closed: 'Closed',
};

/** Plain-language meaning of each state, shown beside the status control. */
export const feedbackStatusMeaning: Record<FeedbackStatus, string> = {
  new: 'Just arrived. Nobody has looked at it yet.',
  reviewing: 'Someone is reproducing it and working out what is needed.',
  needs_info: 'Waiting on the reporter to answer a question.',
  planned: 'Accepted and scheduled for a release.',
  fixed: 'Done and verified. The reporter can check it.',
  wont_fix: 'Decided against. The reporter is told why.',
  closed: 'Finished and archived.',
};

export const feedbackStatusStyles: Record<FeedbackStatus, string> = {
  new: 'badge-blue', reviewing: 'badge-amber', needs_info: 'badge-red', planned: 'badge-purple',
  fixed: 'badge-green', wont_fix: 'badge-gray', closed: 'badge-gray',
};

/**
 * Statuses the API refuses without a written reply to the reporter, and without
 * a target release. Mirrors RESPONSE_REQUIRED_STATUSES in feedback.service.ts —
 * the server still enforces both; this only lets the page say so beforehand.
 */
const RESPONSE_REQUIRED: FeedbackStatus[] = ['needs_info', 'fixed', 'wont_fix', 'closed'];

export const needsCustomerResponse = (status: string) => RESPONSE_REQUIRED.includes(status as FeedbackStatus);
export const needsTargetRelease = (status: string) => status === 'planned';

/** What still stands between this draft and a successful save, in plain words. */
export function feedbackBlockers(draft: { status: string; customerResponse: string; targetRelease: string }) {
  const blockers: { field: 'customerResponse' | 'targetRelease'; message: string }[] = [];
  if (needsTargetRelease(draft.status) && !draft.targetRelease.trim())
    blockers.push({ field: 'targetRelease', message: `“${feedbackStatusLabels[draft.status as FeedbackStatus]}” needs a target release.` });
  if (needsCustomerResponse(draft.status) && !draft.customerResponse.trim())
    blockers.push({ field: 'customerResponse', message: `“${feedbackStatusLabels[draft.status as FeedbackStatus]}” needs a reply the reporter can read.` });
  return blockers;
}
