import { DocumentNode, print } from 'graphql';

export interface HttpLinkOptions {
  uri: string;
  headers?: Record<string, string>;
  credentials?: 'same-origin' | 'include' | 'omit'; // Credentials option for cookies
}

export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
  }
}

export interface MammothClientOptions {
  link: HttpLink;
}

export class MammothClient {
  link: HttpLink;

  constructor({ link }: MammothClientOptions) {
    this.link = link;
  }

  async query<TData = unknown>(
    query: DocumentNode,
    variables: Record<string, unknown> = {},
    includeCookies: boolean = false, // Optional flag for including cookies
  ): Promise<TData> {
    try {
      const response = await fetch(this.link.options.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.link.options.headers,
        },
        body: JSON.stringify({
          query: print(query),
          variables,
        }),
        credentials: includeCookies ? 'include' : 'same-origin', // Use 'include' or 'same-origin' for cookies
      });

      if (!response.ok) {
        throw new Error(
          `Network error: ${response.status} ${response.statusText}`,
        );
      }

      const responseBody = await response.json();

      if (responseBody.errors) {
        throw new Error(
          `GraphQL error: ${JSON.stringify(responseBody.errors)}`,
        );
      }

      return responseBody.data as TData;
    } catch (error) {
      console.error('GraphQL query failed', error);
      throw error;
    }
  }
}
