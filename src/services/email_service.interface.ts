export interface EmailPayload {
  to: string ;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailService {
    send(payload: EmailPayload): Promise<void>;
}
