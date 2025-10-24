import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';
import { UserHandlers } from './user-handlers.js';

export class IssueHandlers {
  private fieldMetadataCache: Map<string, string> | null = null;

  constructor(private apiClient: JiraApiClient, private userHandlers: UserHandlers) {}

  /**
   * Fetch and cache field metadata (field ID -> display name mapping)
   */
  private async getFieldMetadata(): Promise<Map<string, string>> {
    if (this.fieldMetadataCache) {
      return this.fieldMetadataCache;
    }

    try {
      const fields = await this.apiClient.get('/field');
      const metadata = new Map<string, string>();

      fields.forEach((field: any) => {
        if (field.id && field.name) {
          metadata.set(field.id, field.name);
        }
      });

      this.fieldMetadataCache = metadata;
      return metadata;
    } catch (error) {
      // If field metadata fetch fails, return empty map
      return new Map<string, string>();
    }
  }

  async handleGetIssue(args: any) {
    try {
      const { issueKey } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }

      const issue = await this.apiClient.get(`/issue/${issueKey}`);
      const fieldMetadata = await this.getFieldMetadata();

      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatIssue(issue, fieldMetadata),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatError(error),
          },
        ],
        isError: true,
      };
    }
  }

  async handleCreateIssue(args: any) {
    try {
      const { projectKey, summary, issueType, description, priority, assignee, labels, customFields } = args;

      if (!projectKey || !summary || !issueType) {
        throw new Error('projectKey, summary, and issueType are required');
      }

      const issueData: any = {
        fields: {
          project: { key: projectKey },
          summary,
          issuetype: { name: issueType },
        },
      };

      // Handle description - convert to ADF format if it's plain text
      if (description) {
        if (typeof description === 'string') {
          // Convert plain text to Atlassian Document Format
          issueData.fields.description = {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description,
                  },
                ],
              },
            ],
          };
        } else {
          // Already in ADF format
          issueData.fields.description = description;
        }
      }

      if (priority) {
        issueData.fields.priority = { name: priority };
      }

      if (assignee) {
        // Auto-resolve email to account ID if needed
        const accountId = await this.userHandlers.resolveUserToAccountId(assignee);
        issueData.fields.assignee = { id: accountId };
      }

      if (labels && Array.isArray(labels)) {
        issueData.fields.labels = labels;
      }

      // Merge custom fields
      if (customFields && typeof customFields === 'object') {
        Object.assign(issueData.fields, customFields);
      }

      const result = await this.apiClient.post('/issue', issueData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Issue created successfully!\n\n**Key**: ${result.key}\n**ID**: ${result.id}\n**URL**: ${this.apiClient.getBaseUrl()}/browse/${result.key}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatError(error),
          },
        ],
        isError: true,
      };
    }
  }

  async handleUpdateIssue(args: any) {
    try {
      const { issueKey, summary, description, priority, assignee, labels, customFields } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }

      const updateData: any = { fields: {} };

      if (summary) updateData.fields.summary = summary;

      // Handle description - convert to ADF format if it's plain text
      if (description) {
        if (typeof description === 'string') {
          // Convert plain text to Atlassian Document Format
          updateData.fields.description = {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: description,
                  },
                ],
              },
            ],
          };
        } else {
          // Already in ADF format
          updateData.fields.description = description;
        }
      }

      if (priority) updateData.fields.priority = { name: priority };

      if (assignee) {
        // Auto-resolve email to account ID if needed
        const accountId = await this.userHandlers.resolveUserToAccountId(assignee);
        updateData.fields.assignee = { id: accountId };
      }

      if (labels) updateData.fields.labels = labels;

      // Merge custom fields
      if (customFields && typeof customFields === 'object') {
        Object.assign(updateData.fields, customFields);
      }

      if (Object.keys(updateData.fields).length === 0) {
        throw new Error('At least one field to update must be provided');
      }

      await this.apiClient.put(`/issue/${issueKey}`, updateData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Issue ${issueKey} updated successfully!`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatError(error),
          },
        ],
        isError: true,
      };
    }
  }

  async handleAssignIssue(args: any) {
    try {
      const { issueKey, assignee } = args;

      if (!issueKey || !assignee) {
        throw new Error('issueKey and assignee are required');
      }

      let assigneeData;
      let assigneeText;

      if (assignee === '-1') {
        assigneeData = { accountId: null };
        assigneeText = 'unassigned';
      } else {
        // Auto-resolve email to account ID if needed
        const accountId = await this.userHandlers.resolveUserToAccountId(assignee);
        assigneeData = { accountId: accountId };
        assigneeText = `assigned to ${assignee}`;
      }

      await this.apiClient.put(`/issue/${issueKey}/assignee`, assigneeData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Issue ${issueKey} ${assigneeText} successfully!`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatError(error),
          },
        ],
        isError: true,
      };
    }
  }
}
