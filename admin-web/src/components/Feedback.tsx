export function Feedback(
  { error, message }: { error?: string; message?: string },
) {
  return (
    <>
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}
    </>
  );
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}
