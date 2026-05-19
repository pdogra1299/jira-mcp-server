import { describe, it, expect, vi } from 'vitest';
import { SearchHandlers } from '../src/handlers/search-handlers.js';

const sampleResult = {
  isLast: true,
  nextPageToken: null,
  issues: [
    {
      key: 'PROJ-1',
      id: '10001',
      self: 'https://example.atlassian.net/rest/api/3/issue/10001',
      fields: { summary: 'First issue', status: { name: 'Open' }, duedate: '2026-06-01' },
    },
  ],
};

describe('SearchHandlers.handleSearchIssues', () => {
  it('passes caller-supplied fields through to POST /search/jql', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue(sampleResult) };
    const handler = new SearchHandlers(apiClient);

    await handler.handleSearchIssues({
      jql: 'project = PROJ',
      fields: ['summary', 'status', 'duedate', 'assignee'],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/search/jql', {
      jql: 'project = PROJ',
      maxResults: 50,
      fields: ['summary', 'status', 'duedate', 'assignee'],
    });
  });

  it('defaults to ["summary"] when fields is omitted', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue(sampleResult) };
    const handler = new SearchHandlers(apiClient);

    await handler.handleSearchIssues({ jql: 'project = PROJ' });

    expect(apiClient.post).toHaveBeenCalledWith('/search/jql', {
      jql: 'project = PROJ',
      maxResults: 50,
      fields: ['summary'],
    });
  });

  it('defaults to ["summary"] when fields is an empty array', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue(sampleResult) };
    const handler = new SearchHandlers(apiClient);

    await handler.handleSearchIssues({ jql: 'project = PROJ', fields: [] });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/search/jql',
      expect.objectContaining({ fields: ['summary'] })
    );
  });

  it('emits structuredContent with the requested fields per issue', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue(sampleResult) };
    const handler = new SearchHandlers(apiClient);

    const result = await handler.handleSearchIssues({
      jql: 'project = PROJ',
      fields: ['summary', 'status', 'duedate'],
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent.count).toBe(1);
    expect(result.structuredContent.isLast).toBe(true);
    expect(result.structuredContent.nextPageToken).toBeNull();
    const issue = result.structuredContent.issues[0];
    expect(issue.key).toBe('PROJ-1');
    expect(issue.id).toBe('10001');
    expect(issue.fields.status.name).toBe('Open');
    expect(issue.fields.duedate).toBe('2026-06-01');
  });

  it('keeps the markdown content channel for backward compatibility', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue(sampleResult) };
    const handler = new SearchHandlers(apiClient);

    const result = await handler.handleSearchIssues({ jql: 'project = PROJ' });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('# Search Results');
    expect(result.content[0].text).toContain('**PROJ-1**: First issue');
  });

  it('handles a response with no issues without throwing', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue({ isLast: true }) };
    const handler = new SearchHandlers(apiClient);

    const result = await handler.handleSearchIssues({ jql: 'project = EMPTY' });

    expect(result.content[0].text).toContain('No issues found');
    expect(result.structuredContent.count).toBe(0);
    expect(result.structuredContent.issues).toEqual([]);
  });

  it('returns an error result if jql is missing', async () => {
    const handler = new SearchHandlers({ post: vi.fn() } as any);

    const result = await handler.handleSearchIssues({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/jql/i);
  });
});
