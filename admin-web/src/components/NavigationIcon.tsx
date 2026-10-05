export function NavigationIcon({ section }: { section: string }) {
  const paths: Record<string, string> = {
    Dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    Alumnos:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    Tests: "M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12h8 M8 16h5",
    Eventos: "M8 2v4 M16 2v4 M3 10h18 M3 4h18v18H3z M8 14h2 M14 14h2 M8 18h2",
    Tips: "M9 18h6 M9 22h6 M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4",
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
