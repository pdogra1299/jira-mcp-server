import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class MetadataHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleGetCreateMetadata(args: any) {
    try {
      const { projectKey, issueType } = args;

      if (!projectKey) {
        throw new Error('projectKey is required');
      }

      // Fetch create metadata for the project
      const params: any = {
        projectKeys: projectKey,
        expand: 'projects.issuetypes.fields',
      };

      if (issueType) {
        params.issuetypeNames = issueType;
      }

      const metadata = await this.apiClient.get('/issue/createmeta', params);

      if (!metadata.projects || metadata.projects.length === 0) {
        throw new Error(`Project ${projectKey} not found or not accessible`);
      }

      const project = metadata.projects[0];
      let response = `# Create Metadata for ${project.name} (${project.key})\n\n`;

      // List all available issue types
      if (project.issuetypes && project.issuetypes.length > 0) {
        project.issuetypes.forEach((type: any) => {
          response += `## ${type.name}\n\n`;

          if (type.fields) {
            const fields = Object.entries(type.fields);
            const requiredFields: any[] = [];
            const optionalFields: any[] = [];

            fields.forEach(([key, field]: [string, any]) => {
              if (field.required) {
                requiredFields.push({ key, ...field });
              } else {
                optionalFields.push({ key, ...field });
              }
            });

            // Show required fields
            if (requiredFields.length > 0) {
              response += `### Required Fields\n\n`;
              requiredFields.forEach((field) => {
                response += `- **${field.key}** (${field.name})\n`;
                response += `  - Type: ${field.schema?.type || 'unknown'}\n`;
                if (field.allowedValues && field.allowedValues.length > 0) {
                  const values = field.allowedValues.map((v: any) => v.name || v.value || v).join(', ');
                  response += `  - Allowed values: ${values}\n`;
                }
                response += '\n';
              });
            }

            // Show optional fields
            if (optionalFields.length > 0) {
              response += `### Optional Fields\n\n`;
              optionalFields.forEach((field) => {
                response += `- **${field.key}** (${field.name})\n`;
                response += `  - Type: ${field.schema?.type || 'unknown'}\n`;
                if (field.allowedValues && field.allowedValues.length > 0 && field.allowedValues.length < 10) {
                  const values = field.allowedValues.map((v: any) => v.name || v.value || v).join(', ');
                  response += `  - Allowed values: ${values}\n`;
                }
                response += '\n';
              });
            }
          }

          response += '\n---\n\n';
        });
      }

      response += `\n💡 Use these field keys in the \`customFields\` parameter when creating issues.`;

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
