// 2dai-cloud-sdk — a typed client for the 2DAI generation API.
// Get a key at https://2dai.io → dashboard → Integrations → API keys.

export { Client } from './client';

export type {
  ClientOptions,
  Account,
  KeyContext,
  Scope,
  QueueStatus,
  QueueTicket,
  QueueState,
  Creation,
  CreationPage,
  CreationRef,
  Folder,
  FolderInput,
  FolderPatch,
  MoveTarget,
  GenerationResult,
  AspectRatio,
  ImageParams,
  RefParams,
  RefTool,
  VideoParams,
  SubmitOptions,
  WaitOptions,
  ListOptions,
  DeleteFolderOptions,
  UploadInput,
  CdnAsset,
  CdnRef,
} from './types';

export type { GenerateNamespace } from './generate';
export type { CreationsNamespace } from './creations';
export type { FoldersNamespace } from './folders';
export type { UploadsNamespace } from './uploads';
export type { QueueNamespace } from './queue';
export type { CdnNamespace, DownloadOptions } from './cdn';

export {
  ApiError,
  AuthError,
  ScopeError,
  InsufficientCreditError,
  SpendLimitError,
  TierError,
  NsfwRejectedError,
  QueueLimitError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  GenerationFailedError,
  TimeoutError,
} from './errors';
export type { ApiErrorBody } from './errors';
