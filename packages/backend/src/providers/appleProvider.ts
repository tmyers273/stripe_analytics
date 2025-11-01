import { BaseOAuthProvider } from './baseProvider';
import type { OAuthTokenResponse, ProviderProfile } from './types';

export class AppleOAuthProvider extends BaseOAuthProvider {
  readonly name = 'apple' as const;

  authorizationUrl(): string {
    throw new Error('Apple OAuth not implemented yet');
  }

  async exchangeCode(): Promise<OAuthTokenResponse> {
    throw new Error('Apple OAuth not implemented yet');
  }

  async fetchProfile(): Promise<ProviderProfile> {
    throw new Error('Apple OAuth not implemented yet');
  }
}
