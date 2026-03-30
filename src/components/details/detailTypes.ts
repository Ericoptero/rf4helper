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

export type DetailSearchParams = {
  detail?: string;
  detailType?: string;
  detailId?: string;
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

export function readDetailSearchParams(params: DetailSearchParams): DetailEntityReference | null {
  if (params.detailType && params.detailId) {
    return decodeDetailEntity(`${params.detailType}:${params.detailId}`);
  }

  return decodeDetailEntity(params.detail);
}

export function writeDetailSearchParams(reference: DetailEntityReference | null) {
  if (!reference) {
    return {
      detail: undefined,
      detailType: undefined,
      detailId: undefined,
    };
  }

  return {
    detail: undefined,
    detailType: reference.type,
    detailId: reference.id,
  };
}

export function buildDetailApiPath(reference: DetailEntityReference) {
  return `/api/details/${encodeURIComponent(reference.type)}/${encodeURIComponent(reference.id)}`;
}
