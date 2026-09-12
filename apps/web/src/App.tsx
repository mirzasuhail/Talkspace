import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { LandingPage } from './pages/LandingPage';
import { RoomPage } from './pages/RoomPage';
import { JoinPage } from './pages/JoinPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomSlug" element={<RoomPage />} />
          <Route path="/join/:roomSlug" element={<JoinPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};
