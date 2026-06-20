import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/Layout/AppLayout';
import BatchesPage from '@/pages/BatchesPage';
import InspectionsPage from '@/pages/InspectionsPage';
import IssuesPage from '@/pages/IssuesPage';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/batches" replace />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
