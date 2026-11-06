export function NavigationIcon({ section }: { section: string }) {
  const paths: Record<string, string> = {
    Dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    Alumnos:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    Emociones: "M12 21s-7-4.6-9.2-9.3C1.2 8.3 3 4.5 6.6 4.5c2 0 3.7 1.1 5.4 3.2 1.7-2.1 3.4-3.2 5.4-3.2 3.6 0 5.4 3.8 3.8 7.2C19 16.4 12 21 12 21z",
    Tests: "M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12h8 M8 16h5",
    Eventos: "M8 2v4 M16 2v4 M3 10h18 M3 4h18v18H3z M8 14h2 M14 14h2 M8 18h2",
  };
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[section]} />
      {section === "Alumnos" && <circle cx="9" cy="7" r="4" />}
    </svg>
  );
}
