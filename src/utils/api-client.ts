import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { basename } from 'path';

export class JiraApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private email: string;
  private authHeader: string;

  constructor(baseUrl: string, email: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.email = email;

    // Create base64 encoded auth token
    const authToken = Buffer.from(`${email}:${apiToken}`).toString('base64');
    this.authHeader = `Basic ${authToken}`;

    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          // Build detailed error message
          let message = `Jira API Error (${status}):\n`;

          // Add error messages array
          if (data?.errorMessages && data.errorMessages.length > 0) {
            message += `\nMessages:\n${data.errorMessages.map((msg: string) => `  - ${msg}`).join('\n')}`;
          }

          // Add field-specific errors
          if (data?.errors && Object.keys(data.errors).length > 0) {
            message += `\n\nField Errors:\n`;
            for (const [field, fieldError] of Object.entries(data.errors)) {
              message += `  - ${field}: ${fieldError}\n`;
            }
          }

          // Fallback to basic message
          if (!data?.errorMessages && !data?.errors) {
            message += data?.message || error.message;
          }

          throw new Error(message);
        }
        throw error;
      }
    );
  }

  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  async uploadAttachment(issueKey: string, filePath: string, fileName?: string): Promise<any[]> {
    const form = new FormData();
    const name = fileName || basename(filePath);
    form.append('file', createReadStream(filePath), { filename: name });

    const response = await this.client.post(
      `/issue/${issueKey}/attachments`,
      form,
      {
        headers: {
          'X-Atlassian-Token': 'no-check',
          ...form.getHeaders(),
        },
      }
    );
    return response.data;
  }

  async downloadAttachment(attachmentId: string): Promise<{ data: Buffer; contentType: string }> {
    const response = await axios.get(
      `${this.baseUrl}/rest/api/3/attachment/content/${attachmentId}`,
      {
        headers: {
          'Authorization': this.authHeader,
          'Accept': '*/*',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 5,
      }
    );

    return {
      data: Buffer.from(response.data),
      contentType: (response.headers['content-type'] as string) || 'application/octet-stream',
    };
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getEmail(): string {
    return this.email;
  }
}
