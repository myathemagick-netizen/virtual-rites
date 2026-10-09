export function safeAssetPath(path) {
  return typeof path === 'string' && path.length <= 240 && /^[a-zA-Z0-9_.\/-]+$/.test(path) && !path.startsWith('/') && path.split('/').every(s => s && s !== '.' && s !== '..');
}
export function mediaPath(ritual, id) {
  const asset=ritual.assets?.[id], root=ritual.assetRoot || `rituals/${ritual.id}`;
  if (!asset || !safeAssetPath(asset.file) || !safeAssetPath(root)) throw new Error('Unknown or unsafe ritual asset: '+id);
  return `${root}/${asset.file}`;
}
