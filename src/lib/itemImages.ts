const itemImageModules = import.meta.glob('@/assets/images/items/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function slugifyItemName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveItemImage(name?: string | null) {
  if (!name) return undefined;

  const fileName = `${slugifyItemName(name)}.png`;
  return itemImageModules[`/src/assets/images/items/${fileName}`];
}
