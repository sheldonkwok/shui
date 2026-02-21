"use client";
import { useEffect, useState } from "react";

export function useSession() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(document.cookie.includes("is_authenticated=1"));
  }, []);

  return { loggedIn };
}
