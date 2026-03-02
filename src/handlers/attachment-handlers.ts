import { existsSync } from 'fs';
import { basename } from 'path';
import { JiraApiClient } from '../utils/api-client.js';
import { JiraFormatters } from '../utils/formatters.js';

export class AttachmentHandlers {
  constructor(private apiClient: JiraApiClient) {}

  async handleListAttachments(args: any) {
    try {
      const { issueKey } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }

      const issue = await this.apiClient.get(`/issue/${issueKey}`, { fields: 'attachment' });
      const attachments = issue.fields?.attachment || [];

      return {
        content: [
          {
            type: 'text',
            text: JiraFormatters.formatAttachments(attachments),
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

  async handleGetAttachmentContent(args: any) {
    try {
      const { attachmentId } = args;

      if (!attachmentId) {
        throw new Error('attachmentId is required');
      }

      // Fetch metadata to get filename and MIME type
      const metadata = await this.apiClient.get(`/attachment/${attachmentId}`);
      const filename: string = metadata.filename || 'unknown';
      const mimeType: string = args.mimeType || metadata.mimeType || 'application/octet-stream';
      const sizeBytes: number = metadata.size || 0;
      const sizeKB = (sizeBytes / 1024).toFixed(1);

      // Download the actual file bytes
      const { data, contentType } = await this.apiClient.downloadAttachment(attachmentId);
      const effectiveMime = contentType.split(';')[0].trim() || mimeType;

      if (effectiveMime.startsWith('text/') || effectiveMime === 'application/json' || effectiveMime === 'application/xml') {
        const text = data.toString('utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `**Attachment**: ${filename} (${effectiveMime}, ${sizeKB} KB)\n\n${text}`,
            },
          ],
        };
      }

      if (effectiveMime.startsWith('image/')) {
        const base64String = data.toString('base64');
        return {
          content: [
            {
              type: 'text',
              text: `**Attachment**: ${filename} (${effectiveMime}, ${sizeKB} KB)`,
            },
            {
              type: 'image',
              data: base64String,
              mimeType: effectiveMime,
            },
          ],
        };
      }

      // Unsupported type (PDF, zip, etc.)
      return {
        content: [
          {
            type: 'text',
            text: `**Attachment**: ${filename}\n**Type**: ${effectiveMime}\n**Size**: ${sizeKB} KB\n\nThis attachment cannot be displayed as text or image. Download it directly from Jira.`,
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

  async handleUploadAttachment(args: any) {
    try {
      const { issueKey, filePath, fileName } = args;

      if (!issueKey) {
        throw new Error('issueKey is required');
      }
      if (!filePath) {
        throw new Error('filePath is required');
      }
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const name = fileName || basename(filePath);
      const result = await this.apiClient.uploadAttachment(issueKey, filePath, name);
      const attachment = result[0];
      const sizeKB = attachment.size ? (attachment.size / 1024).toFixed(1) : 'unknown';

      return {
        content: [
          {
            type: 'text',
            text: `Attachment uploaded successfully to ${issueKey}.\n\n**ID**: ${attachment.id}\n**Filename**: ${attachment.filename}\n**Size**: ${sizeKB} KB\n**MIME type**: ${attachment.mimeType || 'unknown'}`,
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

  async handleDeleteAttachment(args: any) {
    try {
      const { attachmentId } = args;

      if (!attachmentId) {
        throw new Error('attachmentId is required');
      }

      try {
        await this.apiClient.delete(`/attachment/${attachmentId}`);
      } catch (err: any) {
        if (err.message?.includes('(404)')) {
          throw new Error(`Attachment not found: ${attachmentId}`);
        }
        throw err;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Attachment ${attachmentId} deleted successfully.`,
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
