# Jira MCP Server

[![npm version](https://badge.fury.io/js/@nexus2520%2Fjira-mcp-server.svg)](https://www.npmjs.com/package/@nexus2520/jira-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Jira API integration. This server enables AI assistants like Claude to interact with Jira Cloud instances for issue management, search, comments, workflow transitions, and attachment handling.

## Features

- **Issue Management**: Get, create, update, and assign Jira issues with custom field support
- **JQL Search**: Search issues using Jira Query Language
- **Comments**: Add and retrieve comments on issues (supports mentions and links)
- **Workflow**: Get available transitions and change issue status
- **Metadata Discovery**: Get field requirements and allowed values for projects
- **User Search**: Find users by email or name for assignments
- **Projects**: List all accessible projects
- **Attachments**: List, upload, delete attachments and retrieve their content — text files returned as text, images rendered inline via Claude vision
- **API Token Authentication**: Secure authentication using email + API token

## Installation

### Using npm (Recommended)

```bash
npm install -g @nexus2520/jira-mcp-server
```

### From Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pdogra1299/jira-mcp-server.git
   cd jira-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm run build
   ```

### Prerequisites

- Node.js >= 16.0.0
- A Jira Cloud account with API access
- Jira API token (generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens))

## Configuration

### Environment Variables

The server requires the following environment variables:

- `JIRA_EMAIL`: Your Atlassian account email
- `JIRA_API_TOKEN`: Your Jira API token
- `JIRA_BASE_URL`: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)

### Claude Desktop Configuration

Add the following to your Claude Desktop MCP settings file:

**Location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration (if installed via npm)**:
```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": [
        "-y",
        "@nexus2520/jira-mcp-server"
      ],
      "env": {
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token-here",
        "JIRA_BASE_URL": "https://yourcompany.atlassian.net"
      }
    }
  }
}
```

**Configuration (if built from source)**:
```json
{
  "mcpServers": {
    "jira": {
      "name": "jira",
      "command": "node",
      "args": [
        "/absolute/path/to/jira-mcp-server/build/index.js"
      ],
      "transport": "stdio",
      "env": {
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token-here",
        "JIRA_BASE_URL": "https://yourcompany.atlassian.net"
      }
    }
  }
}
```

### Getting Your Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Claude MCP")
4. Copy the generated token
5. Use it in your configuration

## Available Tools

### Issue Management

#### `get_issue`
Get detailed information about a Jira issue.

**Parameters**:
- `issueKey` (required): The issue key (e.g., "PROJ-123")

**Example**:
```
Get details for issue PROJ-123
```

#### `create_issue`
Create a new Jira issue.

**Important**: Always use `get_create_metadata` first to discover required fields, custom fields, and allowed values.

**Parameters**:
- `projectKey` (required): Project key (e.g., "PROJ", "DEV")
- `summary` (required): Issue title
- `issueType` (required): Type (e.g., "Bug", "Task", "Story")
- `description` (optional): Issue description
- `priority` (optional): Priority name
- `assignee` (optional): Assignee account ID or email
- `labels` (optional): Array of labels
- `customFields` (optional): Custom fields object

**Example**:
```
Create a bug in project PROJ with summary "Login button not working" and description "Users cannot log in"
```

#### `update_issue`
Update fields of an existing issue.

**Tip**: Use `get_create_metadata` to discover available custom fields and their allowed values.

**Parameters**:
- `issueKey` (required): Issue to update
- `summary` (optional): New summary
- `description` (optional): New description
- `priority` (optional): New priority
- `assignee` (optional): New assignee
- `labels` (optional): New labels array
- `customFields` (optional): Custom fields object

#### `assign_issue`
Assign an issue to a user.

**Parameters**:
- `issueKey` (required): Issue to assign
- `assignee` (required): User account ID, email, or "-1" to unassign

### Metadata & Discovery

#### `get_create_metadata`
Get field requirements and metadata for creating issues in a project.

**Parameters**:
- `projectKey` (required): Project key
- `issueType` (optional): Filter by specific issue type

#### `search_users`
Search for users by name or email to get their account ID.

**Parameters**:
- `query` (required): Search query (email or name)
- `maxResults` (optional): Max results (default: 50)

### Search

#### `search_issues`
Search for issues using JQL. Returns issue keys and titles.

**Parameters**:
- `jql` (required): JQL query string
- `maxResults` (optional): Max results (default: 50)

**Example JQL queries**:
- `"project = PROJ AND status = Open"`
- `"assignee = currentUser() AND status != Done"`
- `"priority = High AND created >= -7d"`

#### `list_projects`
List all accessible projects.

**Parameters**:
- `maxResults` (optional): Max results (default: 50)

### Comments

#### `add_comment`
Add a comment to an issue.

**Parameters**:
- `issueKey` (required): Issue to comment on
- `comment` (required): Comment text

#### `get_comments`
Get all comments for an issue.

**Parameters**:
- `issueKey` (required): Issue key

### Workflow Transitions

#### `get_transitions`
Get available status transitions for an issue.

**Parameters**:
- `issueKey` (required): Issue key

#### `transition_issue`
Change the status of an issue.

**Parameters**:
- `issueKey` (required): Issue to transition
- `transitionId` (required): Transition ID (from get_transitions)
- `comment` (optional): Comment to add with transition

### Attachments

#### `list_attachments`
List all attachments for a Jira issue, including metadata such as filename, size, MIME type, author, and ID.

**Parameters**:
- `issueKey` (required): Issue key (e.g., "PROJ-123")

**Example**:
```
List attachments on PROJ-123
```

#### `get_attachment_content`
Download and return the content of a Jira attachment. Use `list_attachments` first to get attachment IDs.

- **Text files** (`text/*`, `application/json`, `application/xml`): returned as readable text
- **Images** (`image/*`): returned as base64 — Claude will render them inline
- **Other types** (PDF, zip, etc.): returns a descriptive message with file metadata

**Parameters**:
- `attachmentId` (required): Attachment ID (from list_attachments)
- `mimeType` (optional): MIME type hint; auto-detected from Jira metadata if omitted

**Example**:
```
Get the content of attachment 136904
```

#### `upload_attachment`
Upload a local file as an attachment to a Jira issue.

**Parameters**:
- `issueKey` (required): The issue to attach the file to (e.g., `PROJ-123`)
- `filePath` (required): Absolute or relative local file path to upload
- `fileName` (optional): Override the filename shown in Jira (defaults to the file's basename)

**Example**:
```
Upload /tmp/report.pdf to PROJ-123
```

#### `delete_attachment`
Delete a Jira attachment by its ID. Use `list_attachments` first to get the attachment ID.

**Parameters**:
- `attachmentId` (required): The attachment ID to delete (from `list_attachments`)

**Example**:
```
Delete attachment 136904
```

### API Reference

This server uses the [Jira REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/).

## Troubleshooting

### "Error: JIRA_EMAIL and JIRA_API_TOKEN are required"

Make sure you've set the environment variables in your MCP configuration.

### Authentication errors

- Verify your API token is correct
- Ensure your email matches your Atlassian account
- Check that your JIRA_BASE_URL doesn't have a trailing slash

### Permission errors

The API token uses the permissions of the user who created it. Make sure your account has the necessary permissions for the actions you're trying to perform.

## License

MIT

## Author

Parth Dogra

## Contributing

Feel free to open issues or submit pull requests for improvements!
