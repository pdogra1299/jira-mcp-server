import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class SearchHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleSearchIssues(args: any) {
    try {
      const { jql, maxResults = 50 } = args;

      if (!jql) {
        throw new Error('jql query is required');
      }

      // Use POST with fields parameter to get key and summary
      const requestBody = {
        jql,
        maxResults,
        fields: ['summary'], // Only get summary, key is always included
      };

      const result = await this.apiClient.post('/search/jql', requestBody);

      // Format response with key and title
      let response = `# Search Results\n\n**JQL**: ${jql}\n\n`;
      response += `Found ${result.issues.length} issue(s)${result.isLast ? '' : ' (more available)'}\n\n`;

      if (result.issues && result.issues.length > 0) {
        result.issues.forEach((issue: any) => {
          const key = issue.key;
          const summary = issue.fields?.summary || 'No summary';
          response += `- **${key}**: ${summary}\n`;
        });

        response += `\n💡 Use \`get_issue\` with issue key to get full details.`;

        // Add pagination info
        if (!result.isLast && result.nextPageToken) {
          response += `\n\n**More results available** - ${result.issues.length} shown.`;
        }
      } else {
        response += `No issues found matching the query.`;
      }

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
}
