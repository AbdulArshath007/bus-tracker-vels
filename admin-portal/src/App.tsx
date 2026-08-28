import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Buses } from './pages/Buses';
import { Users } from './pages/Users';
import { StudentProfile } from './pages/StudentProfile';
import { ChatModeration } from './pages/ChatModeration';
import { Logs } from './pages/Logs';

// HashRouter is used instead of BrowserRouter so that GitHub Pages
// (which can't rewrite URLs server-side) handles SPA navigation correctly.
// Routes become /#/login, /#/buses etc.
export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="buses" element={<Buses />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<StudentProfile />} />
          <Route path="chat" element={<ChatModeration />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
