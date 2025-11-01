import { BaseOAuthProvider } from './baseProvider';
import type { OAuthTokenResponse, ProviderProfile } from './types';

export class FacebookOAuthProvider extends BaseOAuthProvider {
  readonly name = 'facebook' as const;

  authorizationUrl(): string {
    throw new Error('Facebook OAuth not implemented yet');
  }

  async exchangeCode(): Promise<OAuthTokenResponse> {
    throw new Error('Facebook OAuth not implemented yet');
  }

  async fetchProfile(): Promise<ProviderProfile> {
    throw new Error('Facebook OAuth not implemented yet');
  }
}
