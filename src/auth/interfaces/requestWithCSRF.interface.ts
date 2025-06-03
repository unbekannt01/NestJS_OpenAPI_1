import { Request } from 'express';
import { Session, SessionData } from 'express-session';

export interface RequestWithCsrf extends Request {
  session: Session & Partial<SessionData> & {
    csrfToken?: string;
  };
}