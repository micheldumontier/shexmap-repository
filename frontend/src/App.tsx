import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell.js';
import HomePage from './pages/HomePage.js';
import BrowsePage from './pages/BrowsePage.js';
import ShExMapPage from './pages/ShExMapPage.js';
import SubmitPage from './pages/SubmitPage.js';
import CoveragePage from './pages/CoveragePage.js';
import SparqlPage from './pages/SparqlPage.js';
import DashboardPage from './pages/DashboardPage.js';
import NotFoundPage from './pages/NotFoundPage.js';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/maps/:id" element={<ShExMapPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/coverage" element={<CoveragePage />} />
        <Route path="/sparql" element={<SparqlPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
