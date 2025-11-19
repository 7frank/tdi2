// Browser-compatible path polyfill
export const sep = '/';
export const delimiter = ':';

export function normalize(p: string): string {
  return p.replace(/\\/g, '/');
}

export function join(...paths: string[]): string {
  return paths.join('/').replace(/\/+/g, '/');
}

export function resolve(...paths: string[]): string {
  return join(...paths);
}

export function relative(from: string, to: string): string {
  return to;
}

export function dirname(p: string): string {
  const lastSlash = p.lastIndexOf('/');
  return lastSlash === -1 ? '.' : p.slice(0, lastSlash);
}

export function basename(p: string, ext?: string): string {
  const base = p.split('/').pop() || '';
  if (ext && base.endsWith(ext)) {
    return base.slice(0, -ext.length);
  }
  return base;
}

export function extname(p: string): string {
  const base = basename(p);
  const lastDot = base.lastIndexOf('.');
  return lastDot === -1 ? '' : base.slice(lastDot);
}

export default {
  sep,
  delimiter,
  normalize,
  join,
  resolve,
  relative,
  dirname,
  basename,
  extname,
};
