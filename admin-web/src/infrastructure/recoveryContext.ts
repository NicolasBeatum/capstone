// Extraer a memoria y limpiar antes de renderizar; no persistir el enlace.
let token: string | null = null;
if (location.pathname === "/recover") {
  const params = new URLSearchParams(location.search);
  const candidate = params.get("token_hash");
  if (
    params.get("type") === "recovery" && candidate && candidate.length <= 500 &&
    /^[A-Za-z0-9_-]+$/.test(candidate)
  ) token = candidate;
  history.replaceState(null, "", "/recover");
}
export function hasRecoveryToken() {
  return token !== null;
}
export function takeRecoveryToken() {
  const value = token;
  token = null;
  return value;
}
