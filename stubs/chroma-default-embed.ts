export class DefaultEmbeddingFunction {
  constructor() {
    throw new Error(
      'The @chroma-core/default-embed stub was invoked. Please ensure a custom embedding function is provided.'
    );
  }

  // Keep the signature compatible with Chroma expectations.
  async generate() {
    throw new Error('DefaultEmbeddingFunction.generate is not implemented in this stub.');
  }
}

export default DefaultEmbeddingFunction;
