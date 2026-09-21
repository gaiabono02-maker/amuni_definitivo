export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const raw = String(value ?? "");
    const safe = /^[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = rows.map(row => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8;"}));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
