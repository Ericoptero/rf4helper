export type DetailEntityType =
  | 'item'
  | 'character'
  | 'birthday'
  | 'monster'
  | 'fish'
  | 'map'
  | 'festival'
  | 'crop';

export type DetailEntityReference = {
  type: DetailEntityType;
  id: string;
};

export function encodeDetailEntity(reference: DetailEntityReference) {
  return `${reference.type}:${reference.id}`;
}

export function decodeDetailEntity(value: string | undefined | null): DetailEntityReference | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  const type = value.slice(0, separatorIndex) as DetailEntityType;
  const id = value.slice(separatorIndex + 1);

  if (!id) {
    return null;
  }

  if (!['item', 'character', 'birthday', 'monster', 'fish', 'map', 'festival', 'crop'].includes(type)) {
    return null;
  }

  return { type, id };
}
