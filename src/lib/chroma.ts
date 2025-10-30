import { ChromaClient, type Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';

// Lazy singleton so we don't create multiple remote connections.
let _client: ChromaClient;
let _embeddingFunction: OpenAIEmbeddingFunction;

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getChromaClient() {
  if (_client) return _client;

  const {
    CHROMA_URL: path,
    CHROMA_API_KEY: credentials,
    CHROMA_TENANT: tenant,
    CHROMA_DATABASE: database,
  } = process.env;

  if (!path || !credentials || !tenant || !database) {
    throw new Error('Missing Chroma env variables');
  }

  _client = new ChromaClient({
    path,
    auth: { provider: 'token', credentials, tokenHeaderType: 'X_CHROMA_TOKEN' },
    tenant,
    database,
  });

  return _client;
}

export function getEmbeddingFunction() {
  if (_embeddingFunction) return _embeddingFunction;

  const apiKey = requireEnv('OPENAI_API_KEY');

  _embeddingFunction = new OpenAIEmbeddingFunction({
    apiKey,
    modelName: 'text-embedding-3-small',
  });

  return _embeddingFunction;
}

export async function getOrCreateCollection(name: string): Promise<Collection> {
  const client = getChromaClient();
  const embeddingFunction = getEmbeddingFunction();

  try {
    return await client.getCollection({ name, embeddingFunction });
  } catch {
    try {
      return await client.createCollection({ name, embeddingFunction });
    } catch (createErr) {
      const message =
        createErr && typeof createErr === 'object' && 'message' in createErr
          ? String((createErr as { message?: unknown }).message ?? '')
          : '';

      if (message.toLowerCase().includes('already') && message.toLowerCase().includes('exist')) {
        return client.getCollection({ name, embeddingFunction });
      }

      throw createErr;
    }
  }
}
