// API Configuration with environment support
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const API_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

if (!API_KEY) {
  console.warn('Missing VITE_OPENROUTER_API_KEY environment variable');
}

export class APIError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'APIError';
    this.code = code;
  }
}

export class APIClient {
  private static requestCount = 0;
  private static lastRequestTime = 0;
  private static readonly RATE_LIMIT_MS = 200; // Minimum 200ms between requests

  static async chat(
    content: string,
    model: string = DEFAULT_MODEL,
    systemPrompt?: string
  ): Promise<string> {
    // Rate limiting
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(r => setTimeout(r, this.RATE_LIMIT_MS - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    if (!API_KEY) {
      throw new APIError('API key not configured', 'NO_API_KEY');
    }

    try {
      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            { role: 'user' as const, content },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const error = new APIError(`API Error: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new APIError('Invalid API response format', 'INVALID_RESPONSE');
      }

      return data.choices[0].message.content;
    } catch (err) {
      if (err instanceof APIError) throw err;
      const error = new APIError(err instanceof Error ? err.message : 'Unknown error');
      error.code = 'NETWORK_ERROR';
      throw error;
    }
  }

  static getRequestCount(): number {
    return this.requestCount;
  }

  static resetRequestCount(): void {
    this.requestCount = 0;
  }
}

export { API_KEY, API_BASE, DEFAULT_MODEL };
