import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../services/SocketProvider';
import api from '../services/api';

export const ChatModeration: React.FC = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    // Fetch rooms (could be mapped to active routes)
    const fetchRooms = async () => {
      try {
        const res = await api.get('/buses'); // In a real app we'd fetch actual chat rooms mapped to routes
        setRooms(res.data.map((b: any) => ({
          id: b.current_assignment?.route_id || b.id,
          name: b.current_assignment?.route_name || `Bus ${b.registration_number}`,
        })));
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!socket || !selectedRoom) return;

    // Load message history via REST
    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/${selectedRoom}/messages?limit=50`);
        setMessages(res.data.items || res.data);
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    loadHistory();

    const handleNewMessage = (msg: any) => {
      if (msg.room_id === selectedRoom) {
        setMessages((prev) => [msg, ...prev]);
      }
    };

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) => 
        prev.map(m => m.id === data.message_id ? { ...m, is_deleted: true } : m)
      );
    };

    socket.on('chat.message', handleNewMessage);
    socket.on('chat.message_deleted', handleMessageDeleted);

    return () => {
      socket.off('chat.message', handleNewMessage);
      socket.off('chat.message_deleted', handleMessageDeleted);
    };
  }, [socket, selectedRoom]);

  const sendAnnouncement = async () => {
    if (!announcement.trim() || !selectedRoom) return;
    try {
      await api.post(`/chat/${selectedRoom}/messages`, {
        content: `[ANNOUNCEMENT] ${announcement}`
      });
      setAnnouncement('');
    } catch (err) {
      console.error('Failed to send announcement', err);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await api.delete(`/chat/messages/${msgId}`);
      // Optimistic update
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    // Mock creating a room
    const newRoom = {
      id: Math.random().toString(36).substr(2, 9),
      name: newRoomName
    };
    
    setRooms([...rooms, newRoom]);
    setShowAddRoomModal(false);
    setNewRoomName('');
    setSelectedRoom(newRoom.id);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      
      {/* Sidebar: Rooms List */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{t('nav.chat')}</h3>
          <button className="primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setShowAddRoomModal(true)}>+ New Room</button>
        </div>
        <ul style={{ listStyle: 'none', overflowY: 'auto', flex: 1, margin: 0, padding: 0 }}>
          {rooms.map(room => (
            <li 
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: selectedRoom === room.id ? 'var(--color-primary)' : 'transparent',
                color: selectedRoom === room.id ? 'white' : 'inherit'
              }}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Main: Chat View */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Moderating Room: {rooms.find(r => r.id === selectedRoom)?.name}</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '1rem' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {msg.sender_name} <span style={{ color: 'var(--text-muted)' }}>({msg.sender_role})</span>
                    </span>
                    {!msg.is_deleted && (
                      <button 
                        className="danger outline" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => deleteMessage(msg.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {msg.is_deleted ? (
                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.875rem' }}>This message was deleted by admin.</p>
                  ) : (
                    <p style={{ fontSize: '0.875rem' }}>{msg.content}</p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <input 
                type="text" 
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="Type an announcement to broadcast..." 
                style={{ flex: 1 }} 
              />
              <button className="primary" onClick={sendAnnouncement}>Broadcast</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a room to moderate
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create Chat Room</h3>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Room Name</label>
                <input type="text" required value={newRoomName} onChange={e => setNewRoomName(e.target.value)} style={{ width: '100%' }} placeholder="e.g. Route 42 General"/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="outline" onClick={() => setShowAddRoomModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
