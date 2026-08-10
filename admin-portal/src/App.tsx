import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Buses } from './pages/Buses';
import { Users } from './pages/Users';
import { StudentProfile } from './pages/StudentProfile';
import { ChatModeration } from './pages/ChatModeration';
import { Logs } from './pages/Logs';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;
