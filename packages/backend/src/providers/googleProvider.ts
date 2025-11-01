import { BaseOAuthProvider } from './baseProvider';
import type { OAuthTokenResponse, ProviderProfile } from './types';

export class GoogleOAuthProvider extends BaseOAuthProvider {
  readonly name = 'google' as const;

  authorizationUrl(): string {
    throw new Error('Google OAuth not implemented yet');
  }

  async exchangeCode(): Promise<OAuthTokenResponse> {
    throw new Error('Google OAuth not implemented yet');
  }

  async fetchProfile(): Promise<ProviderProfile> {
    throw new Error('Google OAuth not implemented yet');
  }
}
