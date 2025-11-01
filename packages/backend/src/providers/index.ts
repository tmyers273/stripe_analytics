import { AppleOAuthProvider } from './appleProvider';
import { FacebookOAuthProvider } from './facebookProvider';
import { GoogleOAuthProvider } from './googleProvider';
import type { OAuthProviderName, OAuthProvider } from './types';

export const providerRegistry: Record<OAuthProviderName, OAuthProvider> = {
  google: new GoogleOAuthProvider(),
  facebook: new FacebookOAuthProvider(),
  apple: new AppleOAuthProvider(),
};

export * from './types';
