# Jira MCP Server

[![npm version](https://badge.fury.io/js/@nexus2520%2Fjira-mcp-server.svg)](https://www.npmjs.com/package/@nexus2520/jira-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Jira API integration. This server enables AI assistants like Claude to interact with Jira Cloud instances for issue management, search, comments, workflow transitions, and attachment handling.

<a href="https://glama.ai/mcp/servers/@pdogra1299/jira-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@pdogra1299/jira-mcp-server/badge" alt="Jira Server MCP server" />
</a>

## Features

- **Issue Management**: Get, create, update, and assign Jira issues with custom field support
- **JQL Search**: Search issues using Jira Query Language
- **Comments**: Add and retrieve comments on issues
- **Workflow**: Get available transitions and change issue status
- **Metadata Discovery**: Get field requirements and allowed values for projects
- **User Search**: Find users by email or name for assignments
- **Projects**: List all accessible projects
- **Attachments**: List, upload, delete attachments and retrieve their content — text files returned as text, images rendered inline via Claude vision
- **Token Efficient**: 5 compound tools instead of 16 flat tools — ~50% fewer tokens per session

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
      "command": "node",
      "args": [
        "/absolute/path/to/jira-mcp-server/build/index.js"
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

### Getting Your Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Claude MCP")
4. Copy the generated token
5. Use it in your configuration

## Tool Architecture

This server exposes **5 compound tools** — each with an `action` parameter that selects the operation. This design reduces the token overhead of tool definitions by ~50% compared to 16 flat tools, leaving more context for actual work.

| Tool | Actions | Description |
|------|---------|-------------|
| `jira_issues` | `get` `create` `update` `assign` | Full issue lifecycle management |
| `jira_search` | `issues` `projects` `users` `create_metadata` | Search and discovery |
| `jira_comments` | `get` `add` | Read and write comments |
| `jira_workflow` | `get_transitions` `transition` | Status transitions |
| `jira_attachments` | `list` `get_content` `upload` `delete` | File attachments |

---

## Available Tools

### `jira_issues`

Manage the full lifecycle of Jira issues.

**Required**: `action`

| Action | Description | Required params | Optional params |
|--------|-------------|-----------------|-----------------|
| `get` | Fetch full issue details | `issueKey` | — |
| `create` | Create a new issue | `projectKey`, `summary`, `issueType` | `description`, `priority`, `assignee`, `labels`, `customFields` |
| `update` | Edit fields on an existing issue | `issueKey` | `summary`, `description`, `priority`, `assignee`, `labels`, `customFields` |
| `assign` | Set or clear the assignee | `issueKey`, `assignee` | — |

**Tips**:
- Always call `jira_search` with `action=create_metadata` before creating issues to discover required custom fields and allowed values.
- Pass `assignee: "-1"` to unassign an issue.
- `description` accepts plain text or an [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/) object.
- `customFields` is a key-value map: `{"customfield_10000": "value"}`.

**Examples**:
```
Get details for PROJ-123
Create a Bug in project PROJ with summary "Login button broken"
Update PROJ-123 priority to High
Assign PROJ-123 to john.doe@company.com
```

---

### `jira_search`

Search and discover Jira resources.

**Required**: `action`

| Action | Description | Required params | Optional params |
|--------|-------------|-----------------|-----------------|
| `issues` | Search issues via JQL | `jql` | `maxResults` |
| `projects` | List all accessible projects | — | `maxResults` |
| `users` | Find users by name or email | `query` | `maxResults` |
| `create_metadata` | Get field requirements for creating issues | `projectKey` | `issueType` |

**Common JQL examples**:
```
project = PROJ AND status = Open
assignee = currentUser() AND status != Done
priority = High AND created >= -7d
```

**Tips**:
- Use `create_metadata` before `jira_issues` `create` to understand what fields are required for a project/issue type.
- Use `users` to look up account IDs for assignments — pass the returned account ID or email to `jira_issues` `assign`.

---

### `jira_comments`

Read and write comments on a Jira issue.

**Required**: `action`, `issueKey`

| Action | Description | Required params |
|--------|-------------|-----------------|
| `get` | Fetch all comments on an issue | — |
| `add` | Post a new comment | `comment` |

`comment` accepts plain text or an ADF object.

**Examples**:
```
Get all comments on PROJ-123
Add a comment to PROJ-123: "Fixed in PR #456"
```

---

### `jira_workflow`

Manage issue status transitions.

**Required**: `action`, `issueKey`

| Action | Description | Required params | Optional params |
|--------|-------------|-----------------|-----------------|
| `get_transitions` | List available status transitions | — | — |
| `transition` | Move issue to a new status | `transitionId` | `comment` |

**Tip**: Always call `get_transitions` first — transition IDs vary per project and issue type. The `transitionId` from the response is what you pass to `transition`.

**Examples**:
```
Get available transitions for PROJ-123
Move PROJ-123 to "In Progress" (use get_transitions first to find the ID)
```

---

### `jira_attachments`

Manage file attachments on Jira issues.

**Required**: `action`

| Action | Description | Required params | Optional params |
|--------|-------------|-----------------|-----------------|
| `list` | List all attachments with metadata | `issueKey` | — |
| `get_content` | Download and return file content | `attachmentId` | `mimeType` |
| `upload` | Attach a local file to an issue | `issueKey`, `filePath` | `fileName` |
| `delete` | Remove an attachment by ID | `attachmentId` | — |

**Content types returned by `get_content`**:
- **Text files** (`text/*`, `application/json`, `application/xml`): returned as readable text
- **Images** (`image/*`): returned as base64 — Claude will render them inline
- **Other types** (PDF, zip, etc.): returns file metadata with a descriptive message

**Tips**:
- Use `list` first to get attachment IDs before calling `get_content` or `delete`.
- `fileName` in `upload` overrides the filename shown in Jira (defaults to the file's basename).

**Examples**:
```
List attachments on PROJ-123
Get the content of attachment 136904
Upload /tmp/report.pdf to PROJ-123
Delete attachment 136904
```

---

## API Reference

This server uses the [Jira REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/).

## Troubleshooting

### "Error: JIRA_EMAIL and JIRA_API_TOKEN are required"

Make sure you've set the environment variables in your MCP configuration.

### Authentication errors

- Verify your API token is correct
- Ensure your email matches your Atlassian account
- Check that your `JIRA_BASE_URL` doesn't have a trailing slash

### Permission errors

The API token uses the permissions of the user who created it. Make sure your account has the necessary permissions for the actions you're trying to perform.

## License

MIT

## Author

Parth Dogra

## Contributing

Feel free to open issues or submit pull requests for improvements!