// Browser-compatible crypto polyfill using Web Crypto API
export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function createHash(_algorithm: string) {
  return {
    update(_data: string) {
      return this;
    },
    digest(_encoding?: string) {
      // Return a simple hash-like string for browser compatibility
      return Math.random().toString(36).substring(2, 15);
    },
  };
}

export default {
  randomBytes,
  createHash,
};
