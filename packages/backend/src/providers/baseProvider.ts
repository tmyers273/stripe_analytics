import type { OAuthProvider, OAuthTokenResponse, ProviderProfile } from './types';

export abstract class BaseOAuthProvider implements OAuthProvider {
  abstract readonly name: OAuthProvider['name'];

  abstract authorizationUrl(params: { state: string; codeChallenge: string }): Promise<string> | string;

  abstract exchangeCode(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthTokenResponse>;

  abstract fetchProfile(tokens: OAuthTokenResponse): Promise<ProviderProfile>;
}
