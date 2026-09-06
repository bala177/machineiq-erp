import { FeedbackSystem2026090600001 } from './migrations/202609060001-FeedbackSystem';

describe('FeedbackSystem migration', () => {
  it('creates a constrained feedback table and its indexes', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => queries.push(sql)) };
    await new FeedbackSystem2026090600001().up(runner as any);
    const sql = queries.join('\n');
    expect(sql).toContain('CREATE TABLE "feedback"');
    expect(sql).toContain('CHK_feedback_status');
    expect(sql).toContain('FK_feedback_user');
    expect(sql).toContain('IDX_feedback_status_created');
  });
});
