export type EmailTemplate = 'verify-email' | 'reset-password' | 'org-invite';

export type EmailPayload = {
  to: string;
  subject: string;
  template: EmailTemplate;
  variables: Record<string, string>;
};

type LoggerLike = {
  info(metadata: Record<string, unknown>, message?: string): void;
};

export interface EmailService {
  sendEmail(payload: EmailPayload): Promise<void>;
}

export class LoggingEmailService implements EmailService {
  constructor(private readonly logger: LoggerLike) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    this.logger.info(
      {
        channel: 'auth-email-stub',
        template: payload.template,
        to: payload.to,
        variables: payload.variables,
      },
      payload.subject,
    );
  }
}

export class NoopEmailService implements EmailService {
  async sendEmail(): Promise<void> {
    // intentionally empty
  }
}
