export class JiraFormatters {
  /**
   * Extract text from Atlassian Document Format (ADF)
   * Jira uses ADF for rich text fields like description and comments
   * Returns readable text with mentions, links, etc. or raw JSON on parse failure
   */
  private static extractTextFromADF(adf: any): string {
    if (!adf) return '';

    // If it's already a string, return it
    if (typeof adf === 'string') return adf;

    try {
      return this.parseADFNode(adf);
    } catch (error) {
      // Fallback: return raw ADF JSON if parsing fails
      return JSON.stringify(adf, null, 2);
    }
  }

  /**
   * Recursively parse ADF nodes
   */
  private static parseADFNode(adf: any): string {
    if (!adf) return '';
    if (typeof adf === 'string') return adf;

    let text = '';

    // Handle mentions
    if (adf.type === 'mention') {
      const mentionText = adf.attrs?.text || `@${adf.attrs?.id || 'unknown'}`;
      return mentionText;
    }

    // Handle inline cards (links)
    if (adf.type === 'inlineCard') {
      const url = adf.attrs?.url || '';
      return url;
    }

    // Handle text nodes with marks (bold, italic, links, etc.)
    if (adf.type === 'text' && adf.text) {
      text = adf.text;

      // Check for link marks
      if (adf.marks && Array.isArray(adf.marks)) {
        for (const mark of adf.marks) {
          if (mark.type === 'link' && mark.attrs?.href) {
            text = `[${text}](${mark.attrs.href})`;
          }
          // You can add more mark types here (bold, italic, etc.)
        }
      }

      return text;
    }

    // Handle content arrays (recursive)
    if (adf.content && Array.isArray(adf.content)) {
      for (const node of adf.content) {
        text += this.parseADFNode(node);
      }
    }

    // Handle simple text property
    if (adf.text && !adf.marks) {
      text += adf.text;
    }

    // Add formatting based on node type
    if (adf.type === 'paragraph' && text) {
      text += '\n\n';
    }

    if (adf.type === 'listItem') {
      text = '- ' + text.trim() + '\n';
    }

    if (adf.type === 'heading') {
      const level = adf.attrs?.level || 1;
      text = '#'.repeat(level) + ' ' + text.trim() + '\n\n';
    }

    if (adf.type === 'codeBlock') {
      text = '```\n' + text.trim() + '\n```\n\n';
    }

    // Handle hard breaks
    if (adf.type === 'hardBreak') {
      text = '\n';
    }

    return text;
  }

  static formatIssue(issue: any, fieldMetadata?: Map<string, string>): string {
    const fields = issue.fields || {};
    const key = issue.key;
    const summary = fields.summary || 'No summary';

    // Handle description (can be ADF object or string)
    const description = fields.description
      ? this.extractTextFromADF(fields.description).trim() || 'No description'
      : 'No description';

    const status = fields.status?.name || 'Unknown';
    const priority = fields.priority?.name || 'None';
    const issueType = fields.issuetype?.name || 'Unknown';
    const assignee = fields.assignee?.displayName || 'Unassigned';
    const reporter = fields.reporter?.displayName || 'Unknown';
    const created = fields.created ? new Date(fields.created).toLocaleString() : 'Unknown';
    const updated = fields.updated ? new Date(fields.updated).toLocaleString() : 'Unknown';

    let formatted = `# ${key}: ${summary}\n\n`;
    formatted += `**Type**: ${issueType} | **Status**: ${status} | **Priority**: ${priority}\n`;
    formatted += `**Assignee**: ${assignee} | **Reporter**: ${reporter}\n`;
    formatted += `**Created**: ${created} | **Updated**: ${updated}\n\n`;
    formatted += `## Description\n${description}\n`;

    // Add labels if present
    if (fields.labels && fields.labels.length > 0) {
      formatted += `\n**Labels**: ${fields.labels.join(', ')}\n`;
    }

    // Add components if present
    if (fields.components && fields.components.length > 0) {
      const components = fields.components.map((c: any) => c.name).join(', ');
      formatted += `**Components**: ${components}\n`;
    }

    // Add subtasks if present
    if (fields.subtasks && fields.subtasks.length > 0) {
      formatted += `\n## Subtasks\n`;
      fields.subtasks.forEach((subtask: any) => {
        formatted += `- ${subtask.key}: ${subtask.fields?.summary || 'No summary'} (${subtask.fields?.status?.name || 'Unknown'})\n`;
      });
    }

    // Add custom fields
    const customFields = Object.keys(fields).filter(key => key.startsWith('customfield_'));
    if (customFields.length > 0) {
      formatted += `\n## Custom Fields\n\n`;
      customFields.forEach((fieldKey) => {
        const fieldValue = fields[fieldKey];
        if (fieldValue !== null && fieldValue !== undefined) {
          const formattedValue = this.formatCustomFieldValue(fieldValue);

          // Get display name if available
          const displayName = fieldMetadata?.get(fieldKey) || fieldKey;
          const fieldLabel = displayName !== fieldKey
            ? `${displayName} (${fieldKey})`
            : fieldKey;

          formatted += `- **${fieldLabel}**: ${formattedValue}\n`;
        }
      });
    }

    return formatted;
  }

  /**
   * Format custom field value based on its type
   */
  private static formatCustomFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          // Extract name, value, or displayName
          return item.name || item.value || item.displayName || JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
      // Common Jira object patterns
      if (value.name) return value.name;
      if (value.value) return value.value;
      if (value.displayName) return value.displayName;
      if (value.emailAddress) return value.emailAddress;

      // For complex objects, stringify
      return JSON.stringify(value);
    }

    // Handle primitives
    return String(value);
  }

  static formatIssueList(issues: any[]): string {
    if (!issues || issues.length === 0) {
      return 'No issues found.';
    }

    let formatted = `# Found ${issues.length} issue(s)\n\n`;
    issues.forEach((issue) => {
      const fields = issue.fields || {};
      const key = issue.key;
      const summary = fields.summary || 'No summary';
      const status = fields.status?.name || 'Unknown';
      const assignee = fields.assignee?.displayName || 'Unassigned';

      formatted += `## ${key}: ${summary}\n`;
      formatted += `**Status**: ${status} | **Assignee**: ${assignee}\n\n`;
    });

    return formatted;
  }

  static formatComments(comments: any): string {
    if (!comments || !comments.comments || comments.comments.length === 0) {
      return 'No comments found.';
    }

    let formatted = `# Comments (${comments.total || comments.comments.length})\n\n`;
    comments.comments.forEach((comment: any, index: number) => {
      const author = comment.author?.displayName || 'Unknown';
      const created = comment.created ? new Date(comment.created).toLocaleString() : 'Unknown';

      // Handle comment body (can be ADF object or string)
      const body = comment.body
        ? this.extractTextFromADF(comment.body).trim() || 'No content'
        : 'No content';

      formatted += `## Comment ${index + 1} - ${author} (${created})\n`;
      formatted += `${body}\n\n`;
    });

    return formatted;
  }

  static formatTransitions(transitions: any[]): string {
    if (!transitions || transitions.length === 0) {
      return 'No transitions available.';
    }

    let formatted = `# Available Transitions\n\n`;
    transitions.forEach((transition) => {
      const name = transition.name || 'Unknown';
      const id = transition.id || 'Unknown';
      const to = transition.to?.name || 'Unknown';

      formatted += `- **${name}** (ID: ${id}) → ${to}\n`;
    });

    return formatted;
  }

  static formatProjects(projects: any[]): string {
    if (!projects || projects.length === 0) {
      return 'No projects found.';
    }

    let formatted = `# Found ${projects.length} project(s)\n\n`;
    projects.forEach((project) => {
      const key = project.key || 'Unknown';
      const name = project.name || 'No name';
      const projectType = project.projectTypeKey || 'Unknown';
      const lead = project.lead?.displayName || 'Unknown';

      formatted += `## ${key}: ${name}\n`;
      formatted += `**Type**: ${projectType} | **Lead**: ${lead}\n\n`;
    });

    return formatted;
  }

  static formatAttachments(attachments: any[]): string {
    if (!attachments || attachments.length === 0) {
      return 'No attachments found.';
    }

    let formatted = `# Attachments (${attachments.length})\n\n`;
    formatted += `| # | Filename | Size | Type | Author | Date | ID |\n`;
    formatted += `|---|----------|------|------|--------|------|----|\n`;

    attachments.forEach((attachment: any, index: number) => {
      const filename = attachment.filename || 'Unknown';
      const sizeBytes = attachment.size || 0;
      const size = sizeBytes >= 1024 * 1024
        ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${(sizeBytes / 1024).toFixed(1)} KB`;
      const mimeType = attachment.mimeType || 'Unknown';
      const author = attachment.author?.displayName || 'Unknown';
      const created = attachment.created ? new Date(attachment.created).toLocaleString() : 'Unknown';
      const id = attachment.id || 'Unknown';

      formatted += `| ${index + 1} | ${filename} | ${size} | ${mimeType} | ${author} | ${created} | ${id} |\n`;
    });

    return formatted;
  }

  static formatError(error: any): string {
    if (typeof error === 'string') {
      return `Error: ${error}`;
    }

    const message = error.message || error.errorMessages?.[0] || 'Unknown error';
    return `Error: ${message}`;
  }
}
