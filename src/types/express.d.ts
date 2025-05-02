// src/types/express.d.ts
import { User } from "src/user/entities/user.entity"; // Import your User entity here

declare global {
  namespace Express {
    interface Request {
      user?: User;  // This will add the 'user' property to the Request type
    }
  }
}
