import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class SearchHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleSearchIssues(args: any) {
    try {
      const { jql, maxResults = 50, fields: requestedFields } = args;

      if (!jql) {
        throw new Error('jql query is required');
      }

      // Honor caller-supplied fields; fall back to summary-only for backward compat.
      const fields = Array.isArray(requestedFields) && requestedFields.length > 0
        ? requestedFields
        : ['summary'];

      // Use POST with fields parameter; key is always included by JIRA.
      const requestBody = {
        jql,
        maxResults,
        fields,
      };

      const result = await this.apiClient.post('/search/jql', requestBody);
      const issues: any[] = Array.isArray(result.issues) ? result.issues : [];

      // --- markdown rendering (unchanged shape for backward compat) ---
      let response = `# Search Results\n\n**JQL**: ${jql}\n\n`;
      response += `Found ${issues.length} issue(s)${result.isLast ? '' : ' (more available)'}\n\n`;

      if (issues.length > 0) {
        issues.forEach((issue: any) => {
          const key = issue.key;
          const summary = issue.fields?.summary || 'No summary';
          response += `- **${key}**: ${summary}\n`;
        });

        response += `\n💡 Use \`get_issue\` with issue key to get full details.`;

        // Add pagination info
        if (!result.isLast && result.nextPageToken) {
          response += `\n\n**More results available** - ${issues.length} shown.`;
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
        // Machine-readable channel for programmatic consumers. `count` is the
        // number of issues in this page — JIRA's enhanced /search/jql does not
        // return a grand total.
        structuredContent: {
          jql,
          count: issues.length,
          isLast: result.isLast ?? true,
          nextPageToken: result.nextPageToken ?? null,
          issues: issues.map((issue: any) => ({
            key: issue.key,
            id: issue.id,
            self: issue.self,
            fields: issue.fields ?? {},
          })),
        },
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
