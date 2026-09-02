// Artistic styles namespace — the curated style collections behind `generate.artisticStyle`.

import type { Http } from './http';
import type { ArtisticStyle } from './types';

export interface ArtisticStylesNamespace {
  /** Every artistic style currently enabled by the 2DAI curators, with a vignette.
   *  Pass an `artisticStyleId` to `generate.artisticStyle`, or omit it for `'auto'`. */
  list(signal?: AbortSignal): Promise<ArtisticStyle[]>;
}

export function createArtisticStyles(http: Http): ArtisticStylesNamespace {
  return {
    list: async (signal?: AbortSignal) => {
      const res = await http.request<any>('GET', '/v1/artistic-styles', { signal });
      const rows = Array.isArray(res?.artisticStyles) ? res.artisticStyles : [];
      return rows.map(normalizeArtisticStyle);
    },
  };
}

function normalizeArtisticStyle(raw: any): ArtisticStyle {
  return {
    artisticStyleId: raw?.id ?? raw?.artisticStyleId,
    title: raw?.title ?? '',
    thumbnailCdnId: raw?.thumbnailCdnId ?? undefined,
    thumbnailCdnExt: raw?.thumbnailCdnExt ?? undefined,
    directive: raw?.directive ?? undefined,
    raw,
  };
}
