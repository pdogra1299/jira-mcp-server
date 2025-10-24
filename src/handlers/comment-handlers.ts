import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class CommentHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleAddComment(args: any) {
    try {
      const { issueKey, comment } = args;

      if (!issueKey || !comment) {
        throw new Error('issueKey and comment are required');
      }

      // Handle comment body - convert to ADF format if it's plain text
      let commentBody;
      if (typeof comment === 'string') {
        // Convert plain text to Atlassian Document Format
        commentBody = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        };
      } else {
        // Already in ADF format
        commentBody = comment;
      }

      const commentData = {
        body: commentBody,
      };

      const result = await this.apiClient.post(`/issue/${issueKey}/comment`, commentData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Comment added to ${issueKey} successfully!\n\n**Comment ID**: ${result.id}`,
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

  async handleGetComments(args: any) {
    try {
      const { issueKey } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }

      const result = await this.apiClient.get(`/issue/${issueKey}/comment`);

      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatComments(result),
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
