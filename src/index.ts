// 2dai-cloud-sdk — a typed client for the 2DAI generation API.
// Get a key at https://2dai.io → dashboard → Integrations → API keys.

export { Client } from './client';

export type {
  ClientOptions,
  TelegramAuthor,
  Account,
  KeyContext,
  Scope,
  QueueStatus,
  QueueTicket,
  QueueState,
  Creation,
  CreationPage,
  CreationRef,
  CreationActivity,
  CreationSort,
  CreationFilterOptions,
  RandomOptions,
  RatioBucket,
  FeedOptions,
  FeedPage,
  LikeResult,
  NsfwFlagResult,
  NsfwExplanation,
  RefScore,
  BatchAction,
  BatchResult,
  Folder,
  FolderPage,
  FolderInput,
  FolderPatch,
  FolderGroup,
  FolderListOptions,
  FolderListArg,
  FolderSort,
  MoveTarget,
  GenerationResult,
  AspectRatio,
  ImageParams,
  RefParams,
  RefTool,
  VideoParams,
  WallpaperParams,
  SubmitOptions,
  WaitOptions,
  ListOptions,
  DeleteFolderOptions,
  UploadInput,
  DuplicateCheck,
  CdnAsset,
  CdnRef,
  StatsCacheInfo,
  StatsOverview,
  StatsGenerations,
  StatsTop,
  TopRef,
  FinanceWallet,
  AccountTier,
  WalletLockStatus,
  WalletTransaction,
  TransactionPage,
  BalancePoint,
  BalanceHistory,
  CreditHistory,
  CreditSources,
  TokenPrice,
  TierInfo,
} from './types';

export type { GenerateNamespace } from './generate';
export type { CreationsNamespace } from './creations';
export type { FoldersNamespace, FolderGroupsNamespace } from './folders';
export type { UploadsNamespace } from './uploads';
export type { QueueNamespace } from './queue';
export type { CdnNamespace, DownloadOptions, CdnTransform, CdnFetchOptions, CdnFetchArg } from './cdn';
export type { StatsNamespace, StatsGenerationsOptions } from './stats';
export type { FinanceNamespace } from './finance';
export type { Integration } from './types';

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
