import { describe, it, expect, vi } from 'vitest';
import { IssueHandlers } from '../src/handlers/issue-handlers.js';
import { JiraFormatters } from '../src/utils/formatters.js';

describe('IssueHandlers.handleGetIssue', () => {
  it('emits structuredContent alongside the markdown for a fetched issue', async () => {
    const issue = {
      key: 'PROJ-1',
      id: '10001',
      self: 'https://example.atlassian.net/rest/api/3/issue/10001',
      fields: { summary: 'An issue', duedate: '2026-06-01', status: { name: 'Open' } },
    };
    const apiClient: any = {
      get: vi.fn().mockImplementation((endpoint: string) => {
        if (endpoint === '/field') return Promise.resolve([]);
        return Promise.resolve(issue);
      }),
    };
    const handler = new IssueHandlers(apiClient, {} as any);

    const result = await handler.handleGetIssue({ issueKey: 'PROJ-1' });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent.key).toBe('PROJ-1');
    expect(result.structuredContent.id).toBe('10001');
    expect(result.structuredContent.fields.duedate).toBe('2026-06-01');
    expect(result.content[0].type).toBe('text');
  });

  it('returns an error result if issueKey is missing', async () => {
    const handler = new IssueHandlers({ get: vi.fn() } as any, {} as any);

    const result = await handler.handleGetIssue({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/required/i);
  });
});

describe('JiraFormatters.formatIssue', () => {
  it('renders the due date when present', () => {
    const out = JiraFormatters.formatIssue({
      key: 'PROJ-1',
      fields: { summary: 'An issue', duedate: '2026-06-01' },
    });

    expect(out).toContain('**Due**: 2026-06-01');
  });

  it('shows "No due date" when duedate is absent', () => {
    const out = JiraFormatters.formatIssue({
      key: 'PROJ-1',
      fields: { summary: 'An issue' },
    });

    expect(out).toContain('**Due**: No due date');
  });
});
