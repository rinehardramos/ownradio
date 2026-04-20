"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listener } from "@ownradio/shared";
import { getMe, login as apiLogin, logout as apiLogout, getToken } from "../lib/api";
import { reconnectSocket } from "../lib/socket";

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
    const token = getToken();

    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        // Token invalid or expired — clear it
        apiLogout();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    reconnectSocket(); // re-auth the socket with the new token
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    reconnectSocket(); // reconnect as anonymous
  }, []);

  return { user, isLoading, login, logout };
}
