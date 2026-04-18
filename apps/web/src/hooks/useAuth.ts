"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listener } from "@ownradio/shared";
import { getMe, login as apiLogin, logout as apiLogout } from "../lib/api";

const ACCESS_TOKEN_KEY = "ownradio_access_token";
const REFRESH_TOKEN_KEY = "ownradio_refresh_token";

interface UseAuthReturn {
  user: Listener | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<Listener | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        // Token invalid or expired and refresh also failed — clear storage
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    // If PlayGen returns the user object inline, use it; otherwise fetch /me
    if (data.user) {
      setUser(data.user);
    } else {
      const me = await getMe();
      setUser(me);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return { user, isLoading, login, logout };
}
