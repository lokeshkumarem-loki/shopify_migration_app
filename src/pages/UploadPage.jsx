import { useRef, useState } from "react";
import { useMigration } from "../context/MigrationContext.jsx";

export default function UploadPage({ onNext }) {
  const { processFile, isProcessing, error } = useMigration();
  const [isDragging, setIsDragging] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      alert("Please select a valid .csv file");
      return;
    }
    setLocalFile(file);
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearFile = () => {
    setLocalFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleMigrate = () => {
    if (!localFile) return;
    processFile(localFile);
    setTimeout(() => onNext(), 600);
  };

  return (
    <div
      className="min-h-screen bg-[#f4f6f8]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pop { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
        .pop-in { animation: pop 0.25s ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
        .upload-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(150,191,72,0.45); }
        .upload-btn:active { transform: translateY(0px); }
      `}</style>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: "#96BF48" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
              className="sora text-xl text-gray-900 tracking-tight"
              style={{ fontWeight: 800 }}
            >
              Shopify<span style={{ color: "#96BF48" }}>Migration</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 py-20">
        <h1
          className="sora text-5xl font-extrabold text-gray-900 text-center mb-3"
          style={{ letterSpacing: "-1px" }}
        >
          Migrate CSV file
        </h1>
        <p
          className="text-gray-500 text-lg text-center mb-14"
          style={{ maxWidth: 520, lineHeight: 1.6 }}
        >
          Upload your WooCommerce CSV export. We'll clean, transform, and
          convert it into a Shopify-ready file instantly.
        </p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {["Upload", "Process", "Preview & Download"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="sora w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i === 0 ? "#96BF48" : "#e5e7eb",
                    color: i === 0 ? "white" : "#9ca3af",
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${i === 0 ? "text-gray-800" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="flex flex-col items-center text-center rounded-2xl px-16 py-14 transition-all duration-200"
          style={{
            minWidth: 560,
            border: `2.5px dashed ${isDragging ? "#96BF48" : "#c2d9a0"}`,
            background: isDragging
              ? "rgba(150,191,72,0.08)"
              : "rgba(150,191,72,0.03)",
          }}
        >
          <div className="flex items-center gap-3">
            <label htmlFor="csvInput" className="cursor-pointer">
              <div
                className="sora upload-btn text-white font-bold text-lg px-14 py-5 rounded-2xl transition-all duration-150 select-none"
                style={{
                  background: "linear-gradient(135deg,#96BF48 0%,#5a8e00 100%)",
                  boxShadow: "0 6px 28px rgba(150,191,72,0.35)",
                }}
              >
                Select CSV file
              </div>
            </label>
            <input
              ref={inputRef}
              id="csvInput"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onInputChange}
            />
          </div>

          <p className="text-gray-400 text-sm mt-4">or drop CSV here</p>

          {/* File chip */}
          {localFile && (
            <div
              className="pop-in inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full text-sm font-semibold sora"
              style={{ background: "#eaf3d6", color: "#3a6200" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="#3a6200"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M14 2v6h6" stroke="#3a6200" strokeWidth="2" />
              </svg>
              <span>{localFile.name}</span>
              <button
                onClick={clearFile}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#5a8e00",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          {/* Start migration button */}
          {localFile && (
            <button
              onClick={handleMigrate}
              disabled={isProcessing}
              className="pop-in sora font-bold text-base text-white px-10 py-3 rounded-xl mt-5 flex items-center gap-2 transition-all duration-150"
              style={{
                background: isProcessing
                  ? "#aaa"
                  : "linear-gradient(135deg,#96BF48,#5a8e00)",
                boxShadow: isProcessing
                  ? "none"
                  : "0 4px 18px rgba(150,191,72,0.3)",
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? (
                <>
                  <svg
                    className="spin"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray="40 20"
                    />
                  </svg>
                  Processing…
                </>
              ) : (
                <>Start Migration →</>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
