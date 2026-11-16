/** Alternativa accesible de cada gráfico: la misma información como tabla. */
export function ChartTable(
  { caption, head, rows }: { caption: string; head: string[]; rows: string[][] },
) {
  return (
    <details className="chart-table">
      <summary>Ver como tabla</summary>
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0
                    ? <th key={j} scope="row">{cell}</th>
                    : <td key={j}>{cell}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
