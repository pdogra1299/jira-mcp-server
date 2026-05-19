import { describe, it, expect, vi } from 'vitest';
import { LinkHandlers } from '../src/handlers/link-handlers.js';

describe('LinkHandlers.handleAddLink', () => {
  it('builds the correct POST /issueLink body for outward direction', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue({}) };
    const handler = new LinkHandlers(apiClient);

    await handler.handleAddLink({
      issueKey: 'PROJ-1',
      linkedIssueKey: 'PROJ-2',
      linkType: 'Relates',
      direction: 'outward',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/issueLink', {
      type: { name: 'Relates' },
      inwardIssue: { key: 'PROJ-2' },
      outwardIssue: { key: 'PROJ-1' },
    });
  });

  it('inverts inward/outward when direction is inward', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue({}) };
    const handler = new LinkHandlers(apiClient);

    await handler.handleAddLink({
      issueKey: 'PROJ-1',
      linkedIssueKey: 'PROJ-2',
      linkType: 'Blocks',
      direction: 'inward',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/issueLink', {
      type: { name: 'Blocks' },
      inwardIssue: { key: 'PROJ-1' },
      outwardIssue: { key: 'PROJ-2' },
    });
  });

  it('defaults to outward direction when none supplied', async () => {
    const apiClient: any = { post: vi.fn().mockResolvedValue({}) };
    const handler = new LinkHandlers(apiClient);

    await handler.handleAddLink({
      issueKey: 'PROJ-1',
      linkedIssueKey: 'PROJ-2',
      linkType: 'Relates',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/issueLink', {
      type: { name: 'Relates' },
      inwardIssue: { key: 'PROJ-2' },
      outwardIssue: { key: 'PROJ-1' },
    });
  });

  it('returns an error result if a required field is missing', async () => {
    const apiClient: any = { post: vi.fn() };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleAddLink({ issueKey: 'PROJ-1' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/required/i);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('surfaces a Jira API failure via formatError', async () => {
    const apiClient: any = {
      post: vi.fn().mockRejectedValue(new Error('Jira API Error (404): No issue link type')),
    };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleAddLink({
      issueKey: 'PROJ-1',
      linkedIssueKey: 'PROJ-2',
      linkType: 'Bogus',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No issue link type');
  });
});

describe('LinkHandlers.handleListLinks', () => {
  it('labels links from the queried issue perspective (inward/outward)', async () => {
    const blocks = { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' };
    const apiClient: any = {
      get: vi.fn().mockResolvedValue({
        fields: {
          issuelinks: [
            // outwardIssue set => the linked issue is the outward side, so the
            // queried issue is the inward side => use the type's inward label.
            { id: '101', type: blocks, outwardIssue: { key: 'PROJ-2', fields: { summary: 'Story X' } } },
            // inwardIssue set => the linked issue is the inward side, so the
            // queried issue is the outward side => use the type's outward label.
            { id: '102', type: blocks, inwardIssue: { key: 'PROJ-3', fields: { summary: 'Blocker Y' } } },
          ],
        },
      }),
    };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleListLinks({ issueKey: 'PROJ-1' });

    expect(apiClient.get).toHaveBeenCalledWith('/issue/PROJ-1', { fields: 'issuelinks' });
    expect(result.content[0].text).toContain('**is blocked by** PROJ-2');
    expect(result.content[0].text).toContain('**blocks** PROJ-3');
    expect(result.content[0].text).toContain('Link ID: 101');
    expect(result.content[0].text).toContain('Link ID: 102');
  });

  it('reports when an issue has no links', async () => {
    const apiClient: any = {
      get: vi.fn().mockResolvedValue({ fields: { issuelinks: [] } }),
    };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleListLinks({ issueKey: 'PROJ-1' });

    expect(result.content[0].text).toContain('No links found');
  });

  it('returns an error result if issueKey is missing', async () => {
    const handler = new LinkHandlers({ get: vi.fn() } as any);

    const result = await handler.handleListLinks({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/required/i);
  });
});

describe('LinkHandlers.handleRemoveLink', () => {
  it('calls DELETE /issueLink/{linkId}', async () => {
    const apiClient: any = { delete: vi.fn().mockResolvedValue('') };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleRemoveLink({ linkId: '10042' });

    expect(apiClient.delete).toHaveBeenCalledWith('/issueLink/10042');
    expect(result.content[0].text).toContain('10042');
  });

  it('returns an error result if linkId is missing', async () => {
    const handler = new LinkHandlers({ delete: vi.fn() } as any);

    const result = await handler.handleRemoveLink({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/required/i);
  });
});

describe('LinkHandlers.handleGetLinkTypes', () => {
  it('formats the available link types with inward/outward descriptions', async () => {
    const apiClient: any = {
      get: vi.fn().mockResolvedValue({
        issueLinkTypes: [
          { id: '1', name: 'Relates', inward: 'relates to', outward: 'relates to' },
          { id: '2', name: 'Blocks', inward: 'is blocked by', outward: 'blocks' },
        ],
      }),
    };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleGetLinkTypes();

    expect(apiClient.get).toHaveBeenCalledWith('/issueLinkType');
    expect(result.content[0].text).toContain('Relates');
    expect(result.content[0].text).toContain('is blocked by');
    expect(result.content[0].text).toContain('blocks');
  });

  it('reports when no link types are configured', async () => {
    const apiClient: any = { get: vi.fn().mockResolvedValue({ issueLinkTypes: [] }) };
    const handler = new LinkHandlers(apiClient);

    const result = await handler.handleGetLinkTypes();

    expect(result.content[0].text).toContain('No link types configured');
  });
});
