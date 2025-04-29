import { ChromaClient } from 'chromadb';

// Lazy singleton so we don't create multiple remote connections.
let _client: ChromaClient;

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
