import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ParticipantPage from "./pages/ParticipantPage";
import PdfTestPage from "./pages/PdfTestPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/participant" element={<ParticipantPage />} />
      <Route path="/pdf-test" element={<PdfTestPage />} />
      <Route path="/report/:reportId" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
