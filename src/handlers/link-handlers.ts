import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class LinkHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleListLinks(args: any) {
    try {
      const { issueKey } = args;

      if (!issueKey) {
        throw new Error('issueKey is required for list');
      }

      const issue = await this.apiClient.get(`/issue/${issueKey}`, { fields: 'issuelinks' });
      const links = issue.fields?.issuelinks ?? [];

      if (links.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# Links on ${issueKey}\n\nNo links found.`,
            },
          ],
        };
      }

      let response = `# Links on ${issueKey}\n\n`;
      links.forEach((link: any) => {
        const typeName = link.type?.name ?? 'Unknown';
        // Jira returns either inwardIssue or outwardIssue — it names the role of
        // the OTHER issue. If outwardIssue is set, the linked issue is the outward
        // side, so `issueKey` is the inward side and the relationship reads with
        // the type's inward description (and vice-versa).
        if (link.outwardIssue) {
          response += `- **${link.type?.inward ?? typeName}** ${link.outwardIssue.key}: ${link.outwardIssue.fields?.summary ?? '(no summary)'}\n`;
          response += `  - Link ID: ${link.id}\n`;
        }
        if (link.inwardIssue) {
          response += `- **${link.type?.outward ?? typeName}** ${link.inwardIssue.key}: ${link.inwardIssue.fields?.summary ?? '(no summary)'}\n`;
          response += `  - Link ID: ${link.id}\n`;
        }
      });

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

  async handleAddLink(args: any) {
    try {
      const { issueKey, linkedIssueKey, linkType, direction = 'outward' } = args;

      if (!issueKey || !linkedIssueKey || !linkType) {
        throw new Error('issueKey, linkedIssueKey, and linkType are required for add');
      }

      // For symmetric types like "Relates", direction doesn't matter; for directional
      // types, the caller picks which side `issueKey` is on.
      const body = {
        type: { name: linkType },
        inwardIssue: { key: direction === 'inward' ? issueKey : linkedIssueKey },
        outwardIssue: { key: direction === 'inward' ? linkedIssueKey : issueKey },
      };

      await this.apiClient.post('/issueLink', body);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Link created: ${issueKey} <${linkType}> ${linkedIssueKey} (direction: ${direction})`,
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

  async handleRemoveLink(args: any) {
    try {
      const { linkId } = args;

      if (!linkId) {
        throw new Error('linkId is required for remove (use list to find the ID)');
      }

      await this.apiClient.delete(`/issueLink/${linkId}`);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Link ${linkId} removed`,
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

  async handleGetLinkTypes() {
    try {
      const response = await this.apiClient.get('/issueLinkType');
      const types = response.issueLinkTypes ?? [];

      if (types.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '# Available Link Types\n\nNo link types configured in this Jira instance.',
            },
          ],
        };
      }

      let out = `# Available Link Types\n\n`;
      types.forEach((t: any) => {
        out += `- **${t.name}**\n`;
        out += `  - Inward (incoming side): "${t.inward}"\n`;
        out += `  - Outward (outgoing side): "${t.outward}"\n\n`;
      });
      out += `\nUse the \`name\` field as the \`linkType\` parameter to \`jira_links add\`. For symmetric types (Relates, Duplicate) the direction doesn't matter; for directional types (Blocks, Cloners) use \`direction: inward\` or \`direction: outward\` to control which side your \`issueKey\` is on.`;

      return {
        content: [
          {
            type: 'text',
            text: out,
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
