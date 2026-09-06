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
