interface SessionUser {
  firstName: string | null;
  lastName: string | null;
}

interface AuthenticatedSession {
  authenticated: true;
  user: SessionUser;
}

declare namespace App {
  interface Locals {
    session?: AuthenticatedSession;
  }
}
