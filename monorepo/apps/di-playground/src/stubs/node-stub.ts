// Stub for Node.js built-in modules that aren't needed in browser
// ts-morph uses in-memory file system, so these modules are never actually called

export default {};
export const existsSync = () => false;
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const mkdirSync = () => {};
export const resolve = (...args: string[]) => args.join('/');
export const join = (...args: string[]) => args.join('/');
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/');
export const basename = (p: string) => p.split('/').pop() || '';
export const extname = (p: string) => {
  const base = basename(p);
  const idx = base.lastIndexOf('.');
  return idx > 0 ? base.slice(idx) : '';
};
export const createRequire = () => () => ({});
export const randomBytes = () => new Uint8Array(16);
export const createHash = () => ({
  update: () => ({ digest: () => 'stub-hash' })
});
export const platform = 'browser';
export const sep = '/';
