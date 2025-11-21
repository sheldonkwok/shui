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

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}
