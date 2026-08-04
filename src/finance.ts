// Finance namespace — READ-ONLY money data, named 1:1 with the `finance`
// scope. The machine surface carries no money mutations at all: swaps, locks
// and withdrawals stay in the dashboard behind their second factors. Most
// methods need a key minted WITH the opt-in `finance` scope (it is never in
// the mint defaults); `tiers` and `tokenPrice` only need `read`.

import type { Http } from './http';
import type {
  AccountTier,
  BalanceHistory,
  CreditHistory,
  CreditSources,
  FinanceWallet,
  TierInfo,
  TokenPrice,
  TransactionPage,
  WalletLockStatus,
} from './types';

export interface FinanceNamespace {
  /** Balance snapshot: $2DAI tokens, USD credit, tier, and the pending
   *  withdrawal / swap / lock flags. Scope `finance`. */
  wallet(signal?: AbortSignal): Promise<FinanceWallet>;
  /** The effective tier and the 4 legs it is the max of (explicit db pin,
   *  lock watermark, 24h hold watermark, live wallet value). Scope `finance`. */
  tier(signal?: AbortSignal): Promise<AccountTier>;
  /** Staking-lock lifecycle: `none`, `active`, or `expiring-soon` (under 24h
   *  left, or ended pending the expiry sweep). Scope `finance`. */
  lock(signal?: AbortSignal): Promise<WalletLockStatus>;
  /** Deposit / withdrawal / swap history, newest first. `page` is 0-based;
   *  `limit` clamps to 5..50 (default 20). Scope `finance`. */
  transactions(opts?: { limit?: number; page?: number; signal?: AbortSignal }): Promise<TransactionPage>;
  /** $2DAI balance chart points over a window of `limit` DAYS (7..365,
   *  default 90). Scope `finance`. */
  balanceHistory(opts?: { limit?: number; signal?: AbortSignal }): Promise<BalanceHistory>;
  /** USD-credit chart points over a window of `limit` DAYS (7..365, default
   *  90). Scope `finance`. */
  creditHistory(opts?: { limit?: number; signal?: AbortSignal }): Promise<CreditHistory>;
  /** Where credit came from / went over `days` (1..365, default 30):
   *  accrued, bonuses, swapped in, spent on generations. Scope `finance`. */
  creditSources(opts?: { days?: number; signal?: AbortSignal }): Promise<CreditSources>;
  /** The cached $2DAI/USD quote (never triggers a live refresh — `staleMs`
   *  says how old it is). 503 `PRICE_UNAVAILABLE` when no cache exists yet.
   *  Only needs the `read` scope. */
  tokenPrice(signal?: AbortSignal): Promise<TokenPrice>;
  /** The public tier catalogue (names, USD floors, per-tier settings).
   *  Only needs the `read` scope. */
  tiers(signal?: AbortSignal): Promise<TierInfo[]>;
}

export function createFinance(http: Http): FinanceNamespace {
  return {
    wallet: (signal) =>
      http.request('GET', '/v1/wallet', { idempotent: true, signal }),

    tier: (signal) =>
      http.request('GET', '/v1/account/tier', { idempotent: true, signal }),

    lock: (signal) =>
      http.request('GET', '/v1/wallet/lock', { idempotent: true, signal }),

    transactions: (opts = {}) =>
      http.request('GET', '/v1/wallet/transactions', {
        idempotent: true,
        signal: opts.signal,
        query: { limit: opts.limit, page: opts.page },
      }),

    balanceHistory: (opts = {}) =>
      http.request('GET', '/v1/wallet/balance-history', {
        idempotent: true,
        signal: opts.signal,
        query: { limit: opts.limit },
      }),

    creditHistory: (opts = {}) =>
      http.request('GET', '/v1/wallet/credit-history', {
        idempotent: true,
        signal: opts.signal,
        query: { limit: opts.limit },
      }),

    creditSources: (opts = {}) =>
      http.request('GET', '/v1/wallet/credit/sources', {
        idempotent: true,
        signal: opts.signal,
        query: { days: opts.days },
      }),

    tokenPrice: (signal) =>
      http.request('GET', '/v1/token/price', { idempotent: true, signal }),

    tiers: async (signal) => {
      const raw = await http.request<{ tiers: TierInfo[] }>('GET', '/v1/tiers', { idempotent: true, signal });
      return Array.isArray(raw?.tiers) ? raw.tiers : [];
    },
  };
}
