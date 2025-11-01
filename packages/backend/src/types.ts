import type { SessionRecord } from './services/sessionService';
import type { AuthenticatedUser, OrganizationMembership } from './services/authService';

export type AppVariables = {
  user?: AuthenticatedUser;
  session?: SessionRecord;
  memberships?: OrganizationMembership[];
};

export type Env = {
  Variables: AppVariables;
};
