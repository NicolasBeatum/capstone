import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthProvider";
import { Login } from "../pages/Login";
import { Overview } from "../pages/Overview";
import { Students } from "../pages/Students";
import { Recover } from "../pages/Recover";
import { Tests } from "../pages/Tests";
import { TestEditor } from "../pages/TestEditor";
import { Events } from "../pages/Events";
import { Tips } from "../pages/Tips";
import { Brand } from "../components/Brand";
import { NavigationIcon } from "../components/NavigationIcon";
function Protected() {
  const session = useAuth();
  const location = useLocation();
  const section = location.pathname.startsWith("/tests") ? "Tests" : ({
    "/overview": "Dashboard",
    "/students": "Alumnos",
    "/events": "Eventos",
    "/tips": "Tips",
  }[location.pathname] ?? "Administración");
  if (session.loading) return <main role="status">Comprobando sesión…</main>;
  if (!session.allowed) return <Navigate to="/login" replace />;
  return (
    <div className="shell">
      <a className="skip" href="#main">Ir al contenido</a>
      <aside>
        <Link className="brand-link" to="/overview">
          <Brand />
        </Link>
        <p className="sidebar-subtitle">Bienestar y Salud</p>
        <p className="eyebrow sidebar-label">Administración</p>
        <nav aria-label="Administración">
          {[["/overview", "Dashboard"], ["/students", "Alumnos"], [
            "/tests",
            "Tests",
          ], [
            "/events",
            "Eventos",
          ], ["/tips", "Tips"]].map(([path, label]) => (
            <NavLink key={path} to={path}>
              <NavigationIcon section={label} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>Espacio de administración</span>
          <button className="secondary" onClick={() => void session.logout()}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main id="main" tabIndex={-1}>
        <header className="workspace-header">
          <div className="workspace-breadcrumb">
            <span>Bienestar y Salud</span>
            <span aria-hidden="true">/</span>
            <strong>{section}</strong>
          </div>
          <span className="workspace-label">Panel administrativo</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/recover" element={<Recover />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/students" element={<Students />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/tests/new" element={<TestEditor />} />
            <Route path="/tests/versions/:versionId" element={<TestEditor />} />
            <Route path="/events" element={<Events />} />
            <Route path="/tips" element={<Tips />} />
          </Route>
          <Route path="*" element={<Navigate to="/students" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
