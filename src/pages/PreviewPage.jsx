import { useState, useMemo } from "react";
import { useMigration } from "../context/MigrationContext.jsx";


function toCSVString(columns, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = columns.map(escape).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c] ?? "")).join(","))
    .join("\n");
  return header + "\n" + body;
}

function downloadCSV(columns, rows, fileName) {
  const csv = toCSVString(columns, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "shopify-products.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 20;

export default function PreviewPage({ onBack }) {
  const { processedData, fileName, reset } = useMigration();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [visibleCols, setVisibleCols] = useState(null); 

  if (!processedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No data to preview.</p>
          <button
            onClick={onBack}
            className="sora font-bold text-white px-6 py-2 rounded-lg"
            style={{ background: "#96BF48" }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const { columns, rows, stats } = processedData;

  
  const displayCols = visibleCols ?? columns.slice(0, 12);
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;

    const q = search.toLowerCase();

    return rows.filter((row) =>
      columns.some((c) =>
        String(row[c] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, search, columns]);

  if (!rows) return null;
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDownload = () => {
    const baseName = (fileName || "export").replace(/\.csv$/i, "");
    downloadCSV(columns, rows, `${baseName}-shopify.csv`);
  };

  const toggleCol = (col) => {
    if (displayCols.includes(col)) {
      if (displayCols.length === 1) return;
      setVisibleCols(displayCols.filter((c) => c !== col));
    } else {
      setVisibleCols([...displayCols, col]);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f4f6f8]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .table-row:hover td { background: #f0f7e6 !important; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c2d9a0; border-radius: 4px; }
      `}</style>

      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onBack();
              reset();
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#96BF48] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Back
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "#96BF48" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12h6v10"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="sora text-lg text-gray-900 tracking-tight"
              style={{ fontWeight: 800 }}
            >
              Shopify<span style={{ color: "#96BF48" }}>Migration</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["Upload", "Process", "Preview & Download"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="sora w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      i === 2 ? "#96BF48" : i < 2 ? "#d1fae5" : "#e5e7eb",
                    color: i <= 2 ? (i === 2 ? "white" : "#5a8e00") : "#9ca3af",
                  }}
                >
                  {i < 2 ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${i === 2 ? "text-gray-800" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          className="sora font-bold text-sm text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{
            background: "linear-gradient(135deg,#96BF48,#5a8e00)",
            boxShadow: "0 4px 14px rgba(150,191,72,0.35)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download Shopify CSV
        </button>
      </nav>

      <main className="px-8 py-8">
     
        <div className="fade-up grid grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total input rows",
              value: stats.totalRows,
              color: "#6b7280",
              bg: "#f9fafb",
            },
            {
              label: "Variations removed",
              value: stats.removedVariations,
              color: "#ef4444",
              bg: "#fef2f2",
            },
            {
              label: "Zero-stock removed",
              value: stats.removedZeroStock,
              color: "#f59e0b",
              bg: "#fffbeb",
            },
            {
              label: "Shopify rows ready",
              value: stats.finalRows,
              color: "#96BF48",
              bg: "#f0f7e6",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5 shadow-sm border border-gray-100"
              style={{ background: s.bg }}
            >
              <div
                className="sora text-3xl font-extrabold mb-1"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="text-sm font-medium text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

    
        <div
          className="fade-up bg-white rounded-xl border border-gray-100 shadow-sm mb-0 px-5 py-4 flex items-center justify-between"
          style={{
            animationDelay: "0.1s",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="sora font-bold text-gray-800 text-base">
              Preview
              <span
                className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#eaf3d6", color: "#3a6200" }}
              >
                {filteredRows.length} rows
              </span>
            </div>
            {fileName && (
              <span className="text-xs text-gray-400 font-medium">
                {fileName} → shopify-products.csv
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
          
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="#9ca3af"
                  strokeWidth="2"
                />
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search rows…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#96BF48]"
                style={{ width: 220 }}
              />
            </div>

          
            <div className="relative group">
              <button className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#96BF48] flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#6b7280"
                    strokeWidth="2"
                  />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#6b7280"
                    strokeWidth="2"
                  />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#6b7280"
                    strokeWidth="2"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#6b7280"
                    strokeWidth="2"
                  />
                </svg>
                Columns ({displayCols.length}/{columns.length})
              </button>
              <div
                className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20 hidden group-hover:block"
                style={{ width: 260, maxHeight: 320, overflowY: "auto" }}
              >
                <div className="sora text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  Toggle columns
                </div>
                {columns.map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                  >
                    <input
                      type="checkbox"
                      checked={displayCols.includes(col)}
                      onChange={() => toggleCol(col)}
                      style={{ accentColor: "#96BF48" }}
                    />
                    <span className="text-xs text-gray-700 truncate">
                      {col}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

       
        <div
          className="fade-up bg-white rounded-b-xl border border-t-0 border-gray-100 shadow-sm overflow-hidden"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm border-collapse"
              style={{ minWidth: 800 }}
            >
              <thead>
                <tr style={{ background: "#f8fdf2" }}>
                  <th
                    className="sora text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 text-left border-b border-gray-100 sticky left-0 bg-[#f8fdf2]"
                    style={{ minWidth: 40 }}
                  >
                    #
                  </th>
                  {displayCols.map((col) => (
                    <th
                      key={col}
                      className="sora text-xs font-bold text-gray-600 uppercase tracking-wide px-4 py-3 text-left border-b border-gray-100 whitespace-nowrap"
                      style={{ minWidth: 140 }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayCols.length + 1}
                      className="text-center py-16 text-gray-400"
                    >
                      No rows match your search.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, ri) => {
                    const isVariantRow = !row["Title"];
                    return (
                      <tr
                        key={ri}
                        className="table-row"
                        style={{
                          background: isVariantRow ? "#fafff5" : "white",
                        }}
                      >
                        <td className="px-4 py-2.5 text-gray-300 text-xs border-b border-gray-50 sticky left-0 bg-inherit font-mono">
                          {page * PAGE_SIZE + ri + 1}
                        </td>
                        {displayCols.map((col) => {
                          const val = row[col] ?? "";
                          const isImage =
                            col === "Image Src" && val.startsWith("http");
                          const isEmpty = val === "";
                          return (
                            <td
                              key={col}
                              className="px-4 py-2.5 border-b border-gray-50 max-w-xs"
                              style={{ verticalAlign: "middle" }}
                            >
                              {isImage ? (
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline"
                                  style={{ color: "#96BF48" }}
                                >
                                  View Image ↗
                                </a>
                              ) : isEmpty ? (
                                <span className="text-gray-200">—</span>
                              ) : col === "Status" ? (
                                <span
                                  className="sora text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    background:
                                      val === "active" ? "#eaf3d6" : "#f3f4f6",
                                    color:
                                      val === "active" ? "#3a6200" : "#6b7280",
                                  }}
                                >
                                  {val}
                                </span>
                              ) : col === "Published" ? (
                                <span
                                  className="sora text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    background:
                                      val === "true" ? "#eaf3d6" : "#fef2f2",
                                    color:
                                      val === "true" ? "#3a6200" : "#dc2626",
                                  }}
                                >
                                  {val}
                                </span>
                              ) : (
                                <span
                                  className="text-gray-700 text-xs block truncate"
                                  style={{ maxWidth: 200 }}
                                  title={val}
                                >
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

         
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
              <span className="text-xs text-gray-400 font-medium">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, filteredRows.length)} of{" "}
                {filteredRows.length} rows
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#96BF48] disabled:opacity-30 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p =
                    totalPages <= 7
                      ? i
                      : i === 0
                        ? 0
                        : i === 6
                          ? totalPages - 1
                          : page - 2 + i;
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg border text-xs font-bold transition-colors"
                      style={{
                        borderColor: page === p ? "#96BF48" : "#e5e7eb",
                        background: page === p ? "#eaf3d6" : "white",
                        color: page === p ? "#3a6200" : "#6b7280",
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#96BF48] disabled:opacity-30 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

  
        <div
          className="fade-up mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6 flex items-center justify-between"
          style={{ animationDelay: "0.2s" }}
        >
          <div>
            <div className="sora font-bold text-gray-900 text-lg">
              Ready to import into Shopify?
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Your CSV is cleaned, mapped to Shopify columns, and ready to
              upload.
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="sora font-bold text-white px-8 py-3.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(135deg,#96BF48,#5a8e00)",
              boxShadow: "0 6px 22px rgba(150,191,72,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download Shopify CSV
          </button>
        </div>
      </main>
    </div>
  );
}
