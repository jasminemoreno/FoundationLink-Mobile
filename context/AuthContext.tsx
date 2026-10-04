import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import * as storage from "../utils/storage";

type DonorUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_photo?: string | null;
};

type AuthContextType = {
  user: DonorUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<DonorUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DonorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always holds the latest user so updateUser/refreshUser stay stable
  // (never stale, and safe to use as hook dependencies).
  const userRef = useRef<DonorUser | null>(null);

  function applyUser(next: DonorUser | null) {
    userRef.current = next;
    setUser(next);
  }

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedUser = await storage.getItemAsync("user");
      const token = await storage.getItemAsync("token");
      if (storedUser && token) {
        applyUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/login", { email, password });

    if (data.user?.role !== "donor") {
      throw new Error("This app is for donor accounts only.");
    }

    await storage.setItemAsync("token", data.token);
    await storage.setItemAsync("user", JSON.stringify(data.user));
    applyUser(data.user);
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // ignore network errors on logout, clear local state anyway
    }
    await storage.deleteItemAsync("token");
    await storage.deleteItemAsync("user");
    applyUser(null);
  }

  // Merge new user fields into the logged-in user (so fields the server
  // doesn't return, like role, are kept), then save to state + storage.
  // Header and Home read `user` from this context, so they update instantly.
  const updateUser = useCallback(async (updated: Partial<DonorUser>) => {
    if (!updated || !userRef.current) return;
    const merged = { ...userRef.current, ...updated } as DonorUser;
    applyUser(merged);
    try {
      await storage.setItemAsync("user", JSON.stringify(merged));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Pull the latest profile from the server so changes made on another
  // device (e.g. the web app) show up here.
  const refreshUser = useCallback(async () => {
    if (!userRef.current) return;
    try {
      const { data } = await api.get("/donor/profile");
      await updateUser(data);
    } catch (err) {
      console.error(err);
    }
  }, [updateUser]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
