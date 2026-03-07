export const toolDefinitions = [
  {
    name: 'jira_issues',
    description: 'Manage Jira issues. Use get_create_metadata action in jira_search first before creating issues.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'create', 'update', 'assign'],
          description: 'get: fetch issue; create: new issue; update: edit fields; assign: set assignee',
        },
        issueKey: { type: 'string', description: 'Issue key (e.g. PROJ-123). Required for: get, update, assign' },
        projectKey: { type: 'string', description: 'Project key. Required for: create' },
        summary: { type: 'string', description: 'Issue title. Required for: create' },
        issueType: { type: 'string', description: 'e.g. Bug, Task, Story. Required for: create' },
        description: { description: 'Plain text or ADF object' },
        priority: { type: 'string', description: 'e.g. High, Medium, Low' },
        assignee: { type: 'string', description: 'Email or account ID. Use "-1" to unassign. Required for: assign' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Array of label strings' },
        customFields: { type: 'object', description: 'e.g. {"customfield_10000": "value"}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'jira_search',
    description: 'Search and discover Jira resources: issues via JQL, projects, users, or field metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['issues', 'projects', 'users', 'create_metadata'],
          description: 'issues: JQL search; projects: list all; users: find by name/email; create_metadata: field requirements for a project',
        },
        jql: { type: 'string', description: 'JQL query. Required for: issues' },
        query: { type: 'string', description: 'Name or email. Required for: users' },
        projectKey: { type: 'string', description: 'Project key. Required for: create_metadata' },
        issueType: { type: 'string', description: 'Filter by type (e.g. Bug). Optional for: create_metadata' },
        maxResults: { type: 'number', description: 'Max results (default: 50)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'jira_comments',
    description: 'Get or add comments on a Jira issue.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'add'],
          description: 'get: fetch all comments; add: post a comment',
        },
        issueKey: { type: 'string', description: 'Issue key (e.g. PROJ-123)' },
        comment: { description: 'Plain text or ADF object. Required for: add' },
      },
      required: ['action', 'issueKey'],
    },
  },
  {
    name: 'jira_workflow',
    description: 'Manage issue status transitions. Use get_transitions first, then transition with the ID.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_transitions', 'transition'],
          description: 'get_transitions: list available statuses; transition: change status',
        },
        issueKey: { type: 'string', description: 'Issue key (e.g. PROJ-123)' },
        transitionId: { type: 'string', description: 'Transition ID from get_transitions. Required for: transition' },
        comment: { type: 'string', description: 'Plain text comment to add with the transition. Optional for: transition' },
      },
      required: ['action', 'issueKey'],
    },
  },
  {
    name: 'jira_attachments',
    description: 'Manage Jira issue attachments: list, read, upload, or delete.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get_content', 'upload', 'delete'],
          description: 'list: show all attachments; get_content: download file (text returned as text, images as base64); upload: attach local file; delete: remove attachment',
        },
        issueKey: { type: 'string', description: 'Issue key. Required for: list, upload' },
        attachmentId: { type: 'string', description: 'Attachment ID from list. Required for: get_content, delete' },
        filePath: { type: 'string', description: 'Local file path. Required for: upload' },
        fileName: { type: 'string', description: 'Override filename in Jira. Optional for: upload' },
        mimeType: { type: 'string', description: 'MIME hint (auto-detected if omitted). Optional for: get_content' },
      },
      required: ['action'],
    },
  },
];
