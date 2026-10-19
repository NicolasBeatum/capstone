import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { auth } from "../infrastructure/auth";
import {
  adminGateway,
  clearRequests,
  configureSession,
} from "../infrastructure/adminGateway";
interface AuthState {
  loading: boolean;
  allowed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true),
    [allowed, setAllowed] = useState(false);
  const lastUser = useRef<string | null>(null);
  const logout = async () => {
    clearRequests();
    setAllowed(false);
    await auth.auth.signOut({ scope: "local" });
  };
  useEffect(() => {
    let live = true;
    configureSession(() => {
      if (live) {
        setAllowed(false);
        void auth.auth.signOut({ scope: "local" });
      }
    });
    void auth.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          await adminGateway.checkAccess();
          if (live) setAllowed(true);
        } catch {
          if (live) setAllowed(false);
        }
      }
      if (live) setLoading(false);
    });
    const { data } = auth.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        lastUser.current = null;
        clearRequests();
        if (live) setAllowed(false);
      } else {
        const changed = lastUser.current !== null &&
          lastUser.current !== session.user.id;
        lastUser.current = session.user.id;
        if (changed) {
          clearRequests();
          if (live) setAllowed(false);
          queueMicrotask(() => {
            void adminGateway.checkAccess().then(() => {
              if (live && lastUser.current === session.user.id) {
                setAllowed(true);
              }
            }).catch(() => {
              if (live) setAllowed(false);
            });
          });
        }
      }
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const login = async (email: string, password: string) => {
    const response = await auth.auth.signInWithPassword({ email, password });
    if (response.error) {
      throw Error(
        "No se pudo iniciar sesión. Revisa tus credenciales y conexión.",
      );
    }
    try {
      await adminGateway.checkAccess();
      setAllowed(true);
    } catch (error) {
      await logout();
      throw error;
    }
  };
  return (
    <Context.Provider value={{ loading, allowed, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw Error("Contexto de sesión requerido.");
  return c;
}
