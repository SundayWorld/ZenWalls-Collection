export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  if (path.includes('collection')) {
    return path;
  }
  if (path.includes('preview')) {
    return path;
  }
  return '/(tabs)/(home)';
}
