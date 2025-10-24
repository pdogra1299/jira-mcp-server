# Jira MCP Server

A Model Context Protocol (MCP) server for Jira API integration. This server enables AI assistants like Claude to interact with Jira Cloud instances for issue management, search, comments, and workflow transitions.

## Features

- **Issue Management**: Get, create, update, and assign Jira issues
- **JQL Search**: Search issues using Jira Query Language
- **Comments**: Add and retrieve comments on issues
- **Workflow**: Get available transitions and change issue status
- **Projects**: List all accessible projects
- **API Token Authentication**: Secure authentication using email + API token

## Installation

### Prerequisites

- Node.js >= 16.0.0
- A Jira Cloud account with API access
- Jira API token (generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens))

### Setup

1. **Clone or navigate to the repository**:
   ```bash
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

**Configuration**:
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
- `issueKey` (required): The issue key (e.g., "JP-1234")

**Example**:
```
Get details for issue JP-1234
```

#### `create_issue`
Create a new Jira issue.

**Parameters**:
- `projectKey` (required): Project key (e.g., "JP")
- `summary` (required): Issue title
- `issueType` (required): Type (e.g., "Bug", "Task", "Story")
- `description` (optional): Issue description
- `priority` (optional): Priority name
- `assignee` (optional): Assignee account ID or email
- `labels` (optional): Array of labels

**Example**:
```
Create a bug in project JP with summary "Login button not working" and description "Users cannot log in"
```

#### `update_issue`
Update fields of an existing issue.

**Parameters**:
- `issueKey` (required): Issue to update
- `summary` (optional): New summary
- `description` (optional): New description
- `priority` (optional): New priority
- `assignee` (optional): New assignee
- `labels` (optional): New labels array

#### `assign_issue`
Assign an issue to a user.

**Parameters**:
- `issueKey` (required): Issue to assign
- `assignee` (required): User account ID or "-1" to unassign

### Search & Discovery

#### `search_issues`
Search for issues using JQL.

**Parameters**:
- `jql` (required): JQL query string
- `maxResults` (optional): Max results (default: 50)
- `startAt` (optional): Pagination start (default: 0)

**Example JQL queries**:
- `"project = JP AND status = Open"`
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

## Usage Examples

### With Claude Desktop

Once configured, you can interact with Jira naturally:

```
"Show me all open bugs in project JP"
"Create a new task in PROJ with summary 'Update documentation'"
"Add a comment to JP-1234 saying 'Fixed in latest release'"
"What are the available transitions for JP-1234?"
"Move JP-1234 to In Progress"
"Assign JP-1234 to john.doe@company.com"
```

## Development

### Project Structure

```
jira-mcp-server/
├── src/
│   ├── index.ts                    # Main server entry point
│   ├── utils/
│   │   ├── api-client.ts          # Jira API client
│   │   └── formatters.ts          # Response formatters
│   ├── handlers/
│   │   ├── issue-handlers.ts      # Issue CRUD operations
│   │   ├── search-handlers.ts     # JQL search
│   │   ├── comment-handlers.ts    # Comment operations
│   │   ├── transition-handlers.ts # Workflow transitions
│   │   └── project-handlers.ts    # Project operations
│   └── tools/
│       └── definitions.ts         # MCP tool definitions
├── build/                          # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

### Build Commands

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run dev` - Watch mode for development
- `pnpm start` - Run the compiled server

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
