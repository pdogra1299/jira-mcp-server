export const toolDefinitions = [
  // Issue Management Tools
  {
    name: 'get_issue',
    description: 'Get detailed information about a Jira issue by its key or ID',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123) or issue ID (e.g., 378150)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new Jira issue with specified fields. IMPORTANT: Always use get_create_metadata first to discover required fields, custom fields, and allowed values for the project and issue type.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key where the issue will be created (e.g., PROJ, DEV)',
        },
        summary: {
          type: 'string',
          description: 'The issue summary/title',
        },
        issueType: {
          type: 'string',
          description: 'The issue type (e.g., Bug, Task, Story)',
        },
        description: {
          description: 'The issue description in Atlassian Document Format (ADF). Can be a simple string for plain text, or an ADF object for rich formatting. Example ADF: {"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Description text"}]}]}',
        },
        priority: {
          type: 'string',
          description: 'Priority name (e.g., High, Medium, Low) - optional',
        },
        assignee: {
          type: 'string',
          description: 'Assignee account ID or email (will auto-lookup account ID from email) - optional',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of labels - optional',
        },
        customFields: {
          type: 'object',
          description: 'Custom fields as key-value pairs (e.g., {"customfield_10000": "value"}) - optional. Use get_create_metadata to discover available fields.',
        },
      },
      required: ['projectKey', 'summary', 'issueType'],
    },
  },
  {
    name: 'update_issue',
    description: 'Update fields of an existing Jira issue. TIP: Use get_create_metadata to discover available custom fields and their allowed values for the project.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to update (e.g., PROJ-123)',
        },
        summary: {
          type: 'string',
          description: 'New summary/title - optional',
        },
        description: {
          description: 'New description in ADF format or plain string - optional',
        },
        priority: {
          type: 'string',
          description: 'New priority name - optional',
        },
        assignee: {
          type: 'string',
          description: 'New assignee account ID or email (will auto-lookup account ID from email) - optional',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'New labels array - optional',
        },
        customFields: {
          type: 'object',
          description: 'Custom fields as key-value pairs (e.g., {"customfield_10000": "value"}) - optional. Use get_create_metadata to discover available fields.',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'assign_issue',
    description: 'Assign a Jira issue to a user',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to assign (e.g., PROJ-123)',
        },
        assignee: {
          type: 'string',
          description: 'User account ID, email (will auto-lookup account ID), or "-1" to unassign',
        },
      },
      required: ['issueKey', 'assignee'],
    },
  },

  // Search Tools
  {
    name: 'search_issues',
    description: 'Search for Jira issues using JQL (Jira Query Language). Returns issue keys and titles. Use get_issue for full details.',
    inputSchema: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'JQL query string (e.g., "project = PROJ AND status = Open")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
        },
      },
      required: ['jql'],
    },
  },
  {
    name: 'list_projects',
    description: 'List all accessible Jira projects',
    inputSchema: {
      type: 'object',
      properties: {
        maxResults: {
          type: 'number',
          description: 'Maximum number of projects to return (default: 50)',
        },
      },
    },
  },

  // Metadata Tools
  {
    name: 'get_create_metadata',
    description: 'Get field requirements and metadata for creating issues in a project. Shows required fields, custom fields, and allowed values.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ, DEV)',
        },
        issueType: {
          type: 'string',
          description: 'Optional: Filter by specific issue type (e.g., Bug, Task)',
        },
      },
      required: ['projectKey'],
    },
  },

  // User Tools
  {
    name: 'search_users',
    description: 'Search for Jira users by name or email to get their account ID. Use this to find account IDs for assigning issues.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query - can be email, name, or partial match (e.g., "john.doe@company.com" or "John Doe")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
        },
      },
      required: ['query'],
    },
  },

  // Comment Tools
  {
    name: 'add_comment',
    description: 'Add a comment to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to comment on (e.g., PROJ-123)',
        },
        comment: {
          description: 'The comment in ADF format or plain string. Example ADF: {"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Comment text"}]}]}',
        },
      },
      required: ['issueKey', 'comment'],
    },
  },
  {
    name: 'get_comments',
    description: 'Get all comments for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },

  // Transition Tools
  {
    name: 'get_transitions',
    description: 'Get available status transitions for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'transition_issue',
    description: 'Change the status of a Jira issue by transitioning it',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to transition (e.g., PROJ-123)',
        },
        transitionId: {
          type: 'string',
          description: 'The transition ID to execute (get from get_transitions)',
        },
        comment: {
          type: 'string',
          description: 'Optional comment to add with the transition',
        },
      },
      required: ['issueKey', 'transitionId'],
    },
  },

  // Attachment Tools
  {
    name: 'list_attachments',
    description: 'List all attachments for a Jira issue, including metadata such as filename, size, MIME type, author, and ID',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'get_attachment_content',
    description: 'Download and return the content of a Jira attachment. Text files are returned as text, images as base64 for rendering. Use list_attachments first to get attachment IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        attachmentId: {
          type: 'string',
          description: 'The attachment ID (obtained from list_attachments)',
        },
        mimeType: {
          type: 'string',
          description: 'Optional MIME type hint; auto-detected from Jira metadata if omitted',
        },
      },
      required: ['attachmentId'],
    },
  },
  {
    name: 'upload_attachment',
    description: 'Upload a local file as an attachment to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to attach the file to (e.g., PROJ-123)',
        },
        filePath: {
          type: 'string',
          description: 'Absolute or relative local file path to upload',
        },
        fileName: {
          type: 'string',
          description: 'Override the filename shown in Jira (optional, defaults to the file\'s basename)',
        },
      },
      required: ['issueKey', 'filePath'],
    },
  },
  {
    name: 'delete_attachment',
    description: 'Delete a Jira attachment by its ID. Use list_attachments first to get attachment IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        attachmentId: {
          type: 'string',
          description: 'The attachment ID to delete (obtained from list_attachments)',
        },
      },
      required: ['attachmentId'],
    },
  },
];
