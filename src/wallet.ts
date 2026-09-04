import { init, NimiqProvider, SignatureResult } from '@nimiq/mini-app-sdk';
export type WalletError = 'provider-missing' | 'no-account' | 'user-rejected' | 'wallet-error';
export type WalletClient = { connect(): Promise<string>; sign(message: string): Promise<SignatureResult>; };
export function createNimiqWallet(provider?: NimiqProvider): WalletClient {
  let active: NimiqProvider | undefined = provider;
  return {
    async connect() {
      try { active ??= await init({ timeout: 3000 }); } catch { throw new Error('provider-missing'); }
      try { const result = await active.listAccounts(); if (!Array.isArray(result) || !result[0]) throw new Error('no-account'); return result[0]; } catch (error) { if (error instanceof Error && error.message === 'no-account') throw error; throw new Error('wallet-error'); }
    },
    async sign(message) {
      if (!active) { try { active = await init({ timeout: 3000 }); } catch { throw new Error('provider-missing'); } }
      try { const result = await active.sign(message); if (!('signature' in result)) throw new Error('user-rejected'); return result; } catch (error) { if (error instanceof Error && error.message === 'user-rejected') throw error; throw new Error('user-rejected'); }
    }
  };
}
export const walletErrorCopy: Record<WalletError, string> = { 'provider-missing': 'Open FitProof inside Nimiq Pay to connect your wallet.', 'no-account': 'No NIM account was approved. Try connecting again.', 'user-rejected': 'Signing was cancelled. Your quest is still complete and can be proved later.', 'wallet-error': 'Nimiq Pay could not complete that wallet request. Try again.' };
