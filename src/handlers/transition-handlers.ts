import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class TransitionHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleGetTransitions(args: any) {
    try {
      const { issueKey } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }

      const result = await this.apiClient.get(`/issue/${issueKey}/transitions`);

      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatTransitions(result.transitions),
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

  async handleTransitionIssue(args: any) {
    try {
      const { issueKey, transitionId, comment } = args;

      if (!issueKey || !transitionId) {
        throw new Error('issueKey and transitionId are required');
      }

      const transitionData: any = {
        transition: {
          id: transitionId,
        },
      };

      // Add comment if provided
      if (comment) {
        transitionData.update = {
          comment: [
            {
              add: {
                body: comment,
              },
            },
          ],
        };
      }

      await this.apiClient.post(`/issue/${issueKey}/transitions`, transitionData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Issue ${issueKey} transitioned successfully!`,
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
