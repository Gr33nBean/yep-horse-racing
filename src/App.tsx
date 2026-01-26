import { useEffect, useState } from "react";
import AudienceApp from "./audience/AudienceApp";
import ProjectorApp from "./projector/ProjectorApp";
import AdminDashboard from "./admin/AdminDashboard";
import { ErrorBoundary } from "./common/components/ErrorBoundary";

function App() {
  const [mode, setMode] = useState<"audience" | "projector" | "admin">(
    "audience",
  );

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/admin")) {
      setMode("admin");
    } else if (path.includes("/projector")) {
      setMode("projector");
    }
  }, []);

  return (
    <ErrorBoundary>
      {mode === "admin" ? (
        <AdminDashboard />
      ) : mode === "projector" ? (
        <ProjectorApp />
      ) : (
        <AudienceApp />
      )}
    </ErrorBoundary>
  );
}

export default App;
