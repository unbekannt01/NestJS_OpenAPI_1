import { User } from 'src/user/entities/user.entity';

/**
 * This file is used to extend the Express Request interface
 * to include a user property.
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
