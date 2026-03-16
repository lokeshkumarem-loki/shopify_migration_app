import { useState } from "react";
import { MigrationProvider } from "./context/MigrationContext.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import PreviewPage from "./pages/PreviewPage.jsx";

export default function App() {
  const [page, setPage] = useState("upload");

  return (
    <MigrationProvider>
      {page === "upload" ? (
        <UploadPage onNext={() => setPage("preview")} />
      ) : (
        <PreviewPage onBack={() => setPage("upload")} />
      )}
    </MigrationProvider>
  );
}
