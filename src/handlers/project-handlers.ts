import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class ProjectHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleListProjects(args: any) {
    try {
      const { maxResults = 50 } = args || {};

      const params = {
        maxResults,
      };

      const projects = await this.apiClient.get('/project', params);

      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatProjects(projects),
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
