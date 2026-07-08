export function exportToCSV<T extends object>(
  data: T[],
  columns: { key: keyof T & string; label: string }[],
  filename: string
): void {
  if (data.length === 0) return;

  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val == null ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printPage(): void {
  window.print();
}
