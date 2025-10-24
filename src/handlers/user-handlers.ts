import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class UserHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleSearchUsers(args: any) {
    try {
      const { query, maxResults = 50 } = args;

      if (!query) {
        throw new Error('query is required');
      }

      const params = {
        query,
        maxResults,
      };

      const users = await this.apiClient.get('/user/search', params);

      if (!users || users.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No users found matching "${query}"`,
            },
          ],
        };
      }

      let response = `# User Search Results\n\n**Query**: ${query}\n**Found**: ${users.length} user(s)\n\n`;

      users.forEach((user: any) => {
        response += `## ${user.displayName}\n`;
        response += `- **Email**: ${user.emailAddress || 'N/A'}\n`;
        response += `- **Account ID**: \`${user.accountId}\`\n`;
        response += `- **Active**: ${user.active ? 'Yes' : 'No'}\n`;
        response += `- **Account Type**: ${user.accountType || 'N/A'}\n\n`;
      });

      response += `\n💡 Use the **Account ID** when assigning issues.`;

      return {
        content: [
          {
            type: 'text',
            text: response,
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

  /**
   * Helper function to resolve email to account ID
   * Returns the account ID if found, otherwise returns the original value
   */
  async resolveUserToAccountId(emailOrAccountId: string): Promise<string> {
    // If it already looks like an account ID (contains colon), return as-is
    if (emailOrAccountId.includes(':')) {
      return emailOrAccountId;
    }

    // If it looks like an email, try to look it up
    if (emailOrAccountId.includes('@')) {
      try {
        const users = await this.apiClient.get('/user/search', {
          query: emailOrAccountId,
          maxResults: 1,
        });

        if (users && users.length > 0) {
          return users[0].accountId;
        }
      } catch (error) {
        // If lookup fails, return the original value
        // This will let Jira return a proper error message
      }
    }

    // Return as-is (might be account ID without colon, or username)
    return emailOrAccountId;
  }
}
