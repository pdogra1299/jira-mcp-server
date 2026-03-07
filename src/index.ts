#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { JiraApiClient } from './utils/api-client.js';
import { IssueHandlers } from './handlers/issue-handlers.js';
import { SearchHandlers } from './handlers/search-handlers.js';
import { CommentHandlers } from './handlers/comment-handlers.js';
import { TransitionHandlers } from './handlers/transition-handlers.js';
import { ProjectHandlers } from './handlers/project-handlers.js';
import { MetadataHandlers } from './handlers/metadata-handlers.js';
import { UserHandlers } from './handlers/user-handlers.js';
import { AttachmentHandlers } from './handlers/attachment-handlers.js';
import { toolDefinitions } from './tools/definitions.js';

// Get environment variables
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';

// Validate required environment variables
if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Error: JIRA_EMAIL and JIRA_API_TOKEN are required');
  console.error('Please set these in your MCP settings configuration');
  console.error('');
  console.error('Example:');
  console.error('  JIRA_EMAIL=your-email@company.com');
  console.error('  JIRA_API_TOKEN=your-api-token');
  console.error('  JIRA_BASE_URL=https://your-domain.atlassian.net');
  process.exit(1);
}

class JiraMCPServer {
  private server: Server;
  private apiClient: JiraApiClient;
  private issueHandlers: IssueHandlers;
  private searchHandlers: SearchHandlers;
  private commentHandlers: CommentHandlers;
  private transitionHandlers: TransitionHandlers;
  private projectHandlers: ProjectHandlers;
  private metadataHandlers: MetadataHandlers;
  private userHandlers: UserHandlers;
  private attachmentHandlers: AttachmentHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'jira-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize API client
    this.apiClient = new JiraApiClient(
      JIRA_BASE_URL,
      JIRA_EMAIL!,
      JIRA_API_TOKEN!
    );

    // Initialize handlers
    this.userHandlers = new UserHandlers(this.apiClient);
    this.issueHandlers = new IssueHandlers(this.apiClient, this.userHandlers);
    this.searchHandlers = new SearchHandlers(this.apiClient);
    this.commentHandlers = new CommentHandlers(this.apiClient);
    this.transitionHandlers = new TransitionHandlers(this.apiClient);
    this.projectHandlers = new ProjectHandlers(this.apiClient);
    this.metadataHandlers = new MetadataHandlers(this.apiClient);
    this.attachmentHandlers = new AttachmentHandlers(this.apiClient);

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefinitions,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'jira_issues': {
          const args = request.params.arguments as any;
          switch (args.action) {
            case 'get':    return this.issueHandlers.handleGetIssue(args);
            case 'create': return this.issueHandlers.handleCreateIssue(args);
            case 'update': return this.issueHandlers.handleUpdateIssue(args);
            case 'assign': return this.issueHandlers.handleAssignIssue(args);
            default: throw new McpError(ErrorCode.InvalidParams, `Unknown action: ${args.action}`);
          }
        }
        case 'jira_search': {
          const args = request.params.arguments as any;
          switch (args.action) {
            case 'issues':          return this.searchHandlers.handleSearchIssues(args);
            case 'projects':        return this.projectHandlers.handleListProjects(args);
            case 'users':           return this.userHandlers.handleSearchUsers(args);
            case 'create_metadata': return this.metadataHandlers.handleGetCreateMetadata(args);
            default: throw new McpError(ErrorCode.InvalidParams, `Unknown action: ${args.action}`);
          }
        }
        case 'jira_comments': {
          const args = request.params.arguments as any;
          switch (args.action) {
            case 'get': return this.commentHandlers.handleGetComments(args);
            case 'add': return this.commentHandlers.handleAddComment(args);
            default: throw new McpError(ErrorCode.InvalidParams, `Unknown action: ${args.action}`);
          }
        }
        case 'jira_workflow': {
          const args = request.params.arguments as any;
          switch (args.action) {
            case 'get_transitions': return this.transitionHandlers.handleGetTransitions(args);
            case 'transition':      return this.transitionHandlers.handleTransitionIssue(args);
            default: throw new McpError(ErrorCode.InvalidParams, `Unknown action: ${args.action}`);
          }
        }
        case 'jira_attachments': {
          const args = request.params.arguments as any;
          switch (args.action) {
            case 'list':        return this.attachmentHandlers.handleListAttachments(args);
            case 'get_content': return this.attachmentHandlers.handleGetAttachmentContent(args);
            case 'upload':      return this.attachmentHandlers.handleUploadAttachment(args);
            case 'delete':      return this.attachmentHandlers.handleDeleteAttachment(args);
            default: throw new McpError(ErrorCode.InvalidParams, `Unknown action: ${args.action}`);
          }
        }
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Jira MCP server running on stdio`);
    console.error(`Connected to: ${this.apiClient.getBaseUrl()}`);
    console.error(`User: ${this.apiClient.getEmail()}`);
  }
}

const server = new JiraMCPServer();
server.run().catch(console.error);
