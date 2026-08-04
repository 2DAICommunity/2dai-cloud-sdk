// The 2DAI client — the single entry point. Construct it with an API key from
// the dashboard (Integrations → API keys), then reach the API through the
// `generate`, `creations`, `folders`, `uploads`, `queue`, `cdn`, `stats`,
// and `finance` namespaces.

import { Http } from './http';
import { createGenerate, type GenerateNamespace } from './generate';
import { createCreations, type CreationsNamespace } from './creations';
import { createFolders, type FoldersNamespace } from './folders';
import { createUploads, type UploadsNamespace } from './uploads';
import { createQueue, type QueueNamespace } from './queue';
import { createCdn, type CdnNamespace, type DownloadOptions } from './cdn';
import { createStats, type StatsNamespace } from './stats';
import { createFinance, type FinanceNamespace } from './finance';
import type { Account, CdnRef, ClientOptions } from './types';

export class Client {
  /** Text-to-image, ref tools, wallpaper-resize, and video generation. */
  readonly generate: GenerateNamespace;
  /** List / fetch your creations + organise the drive (move/trash/publish/…). */
  readonly creations: CreationsNamespace;
  /** List + CRUD your folders (collections) and sidebar groups. */
  readonly folders: FoldersNamespace;
  /** Upload local media into your library. */
  readonly uploads: UploadsNamespace;
  /** Inspect / wait on / cancel generation queue items. */
  readonly queue: QueueNamespace;
  /** Download creation bytes (image or video) authenticated with your key. */
  readonly cdn: CdnNamespace;
  /** Read-only account analytics (overview / generations / top). */
  readonly stats: StatsNamespace;
  /** Read-only money data — needs the opt-in `finance` scope (except
   *  `tiers` / `tokenPrice`, which only need `read`). */
  readonly finance: FinanceNamespace;

  private readonly http: Http;

  constructor(options: ClientOptions) {
    this.http = new Http(options);
    this.generate = createGenerate(this.http);
    this.creations = createCreations(this.http);
    this.folders = createFolders(this.http);
    this.uploads = createUploads(this.http);
    this.queue = createQueue(this.http);
    this.cdn = createCdn(this.http);
    this.stats = createStats(this.http);
    this.finance = createFinance(this.http);
  }

  /** The API origin this client talks to. */
  get baseUrl(): string {
    return this.http.baseUrl;
  }

  /** `GET /v1/me` — your account, credit, tier, and the calling key's context. */
  me(signal?: AbortSignal): Promise<Account> {
    return this.http.request<Account>('GET', '/v1/me', { idempotent: true, signal });
  }

  /** Shortcut for `cdn.download` — image or video bytes, or a file on disk. */
  download(ref: CdnRef, opts?: DownloadOptions) {
    return this.cdn.download(ref, opts);
  }
}
