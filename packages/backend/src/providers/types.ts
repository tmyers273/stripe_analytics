export type OAuthProviderName = 'google' | 'facebook' | 'apple';

export type OAuthTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
  idToken?: string;
};

export type ProviderProfile = {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  avatarUrl?: string;
};

export interface OAuthProvider {
  readonly name: OAuthProviderName;
  authorizationUrl(params: { state: string; codeChallenge: string }): Promise<string> | string;
  exchangeCode(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthTokenResponse>;
  fetchProfile(tokens: OAuthTokenResponse): Promise<ProviderProfile>;
}
