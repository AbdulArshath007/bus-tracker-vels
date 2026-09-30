import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../services/SocketProvider';
import api from '../services/api';

export const ChatModeration: React.FC = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  
  const [showViewMembersModal, setShowViewMembersModal] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverToAdd, setSelectedDriverToAdd] = useState('');

  useEffect(() => {
    // Fetch rooms from backend ChatController
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chat-rooms'); 
        setRooms(res.data.map((r: any) => ({
          id: r.id,
          name: r.roomName,
        })));
        setFetchError(null);
      } catch (err: any) {
        console.error('Error fetching rooms', err);
        setFetchError(err.response?.status === 429 ? 'Too many requests. Please wait a moment and try again.' : 'Failed to load chat rooms.');
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!socket || !selectedRoom) return;

    // Dynamically join room to ensure we receive updates even if room was created after initial connection
    socket.emit('chat.join', { room_id: selectedRoom });

    // Load message history via REST
    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat-rooms/${selectedRoom}/messages?limit=50`);
        setMessages(res.data.data || res.data);
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    loadHistory();

    const handleNewMessage = (msg: any) => {
      if (msg.room_id === selectedRoom) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) {
            return prev.map(m => m.id === msg.id ? msg : m);
          }
          return [msg, ...prev];
        });
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

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedRoom) return;
    
    const textToSend = messageText;
    setMessageText('');
    
    // Optimistic update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      room_id: selectedRoom,
      sender_name: 'Admin',
      sender_role: 'admin',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [optimisticMsg, ...prev]);
    
    try {
      const res = await api.post(`/chat-rooms/${selectedRoom}/messages`, {
        content: textToSend
      });
      // Replace optimistic with real or remove if WebSocket already handled it
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) {
          return prev.filter(m => m.id !== optimisticMsg.id);
        }
        const formattedMsg = {
          id: res.data.id,
          room_id: res.data.roomId || selectedRoom,
          sender_id: res.data.senderId,
          sender_name: 'Admin',
          sender_role: 'admin',
          content: res.data.content,
          created_at: res.data.createdAt,
        };
        return prev.map(m => m.id === optimisticMsg.id ? formattedMsg : m);
      });
    } catch (err) {
      console.error('Failed to send message', err);
      // Remove optimistic message on fail
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setMessageText(textToSend); // restore text
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await api.delete(`/messages/${msgId}`);
      // Optimistic update
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Removing fake room creation since chat rooms are tied 1:1 to routes.

  const openMembersModal = async () => {
    setShowMembersModal(true);
    try {
      const res = await api.get('/users?role=driver');
      setDrivers(res.data.data || res.data);
      if (res.data.data?.length > 0) {
        setSelectedDriverToAdd(res.data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openViewMembersModal = async () => {
    if (!selectedRoom) return;
    try {
      const res = await api.get(`/chat-rooms/${selectedRoom}/members`);
      setRoomMembers(res.data);
      setShowViewMembersModal(true);
    } catch (err) {
      console.error('Failed to fetch members', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverToAdd || !selectedRoom) return;
    try {
      await api.post(`/chat-rooms/${selectedRoom}/members`, {
        user_id: selectedDriverToAdd,
        role: 'driver'
      });
      alert('Driver added to chat successfully!');
      setShowMembersModal(false);
      
      // Auto refresh members list if it is open
      if (showViewMembersModal) {
        openViewMembersModal();
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to add driver');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      
      {/* Sidebar: Rooms List */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{t('nav.chat')}</h3>
        </div>
        <ul style={{ listStyle: 'none', overflowY: 'auto', flex: 1, margin: 0, padding: 0 }}>
          {fetchError ? (
            <li style={{ padding: '1rem', color: 'var(--color-danger)', fontSize: '0.875rem' }}>
              {fetchError}
            </li>
          ) : rooms.length === 0 ? (
            <li style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No active routes found.
            </li>
          ) : (
            rooms.map(room => (
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
            ))
          )}
        </ul>
      </div>

      {/* Main: Chat View */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Moderating Room: {rooms.find(r => r.id === selectedRoom)?.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="outline" onClick={openViewMembersModal}>View Members</button>
                <button className="outline" onClick={openMembersModal}>Add Driver to Chat</button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem', padding: '1rem' }}>
              {messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div key={msg.id} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: isAdmin ? 'flex-end' : 'flex-start',
                    width: '100%' 
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.5rem' }}>
                      {isAdmin ? 'You' : msg.sender_name} {msg.sender_role && msg.sender_role !== 'admin' ? `(${msg.sender_role})` : ''}
                    </span>
                    <div style={{ 
                      position: 'relative',
                      maxWidth: '75%',
                      padding: '0.75rem 1rem', 
                      backgroundColor: isAdmin ? 'var(--color-primary)' : 'var(--bg-surface)', 
                      color: isAdmin ? 'white' : 'var(--text-main)',
                      borderRadius: '16px',
                      borderBottomRightRadius: isAdmin ? '4px' : '16px',
                      borderBottomLeftRadius: !isAdmin ? '4px' : '16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {msg.is_deleted ? (
                        <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.875rem', opacity: 0.8 }}>This message was deleted.</p>
                      ) : (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', wordBreak: 'break-word' }}>{msg.content}</p>
                          {isAdmin && (
                            <div className="dropdown" style={{ position: 'relative' }}>
                              <button 
                                className="icon-btn" 
                                style={{ background: 'transparent', border: 'none', color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', cursor: 'pointer', padding: '0 0.2rem' }}
                                onClick={(e) => {
                                  e.currentTarget.nextElementSibling?.classList.toggle('show');
                                }}
                              >
                                ⋮
                              </button>
                              <div className="dropdown-menu" style={{ 
                                position: 'absolute', right: 0, top: '100%', 
                                backgroundColor: 'var(--bg-surface)', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                zIndex: 10,
                                display: 'none',
                                minWidth: '100px'
                              }}>
                                <button style={{ width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)' }} onClick={(e) => {
                                  alert('Edit message functionality requires backend update.');
                                  e.currentTarget.parentElement?.classList.remove('show');
                                }}>Edit</button>
                                <button style={{ width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'var(--color-danger)' }} onClick={(e) => {
                                  deleteMessage(msg.id);
                                  e.currentTarget.parentElement?.classList.remove('show');
                                }}>Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', padding: '1rem' }}>
              <input 
                type="text" 
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..." 
                style={{ flex: 1 }} 
              />
              <button className="primary" onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a room to moderate
          </div>
        )}
      </div>

      {/* Add Room Modal removed as rooms are created dynamically with Routes */}

      {/* Manage Members Modal */}
      {showMembersModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add Driver to {rooms.find(r => r.id === selectedRoom)?.name}</h3>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Driver</label>
                <select 
                  value={selectedDriverToAdd} 
                  onChange={e => setSelectedDriverToAdd(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                >
                  <option value="" disabled>-- Select a driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName || d.full_name || d.email}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="outline" onClick={() => setShowMembersModal(false)}>Cancel</button>
                <button type="submit" className="primary">Add to Chat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showViewMembersModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Room Members</h3>
              <button className="outline" onClick={() => setShowViewMembersModal(false)}>Close</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {roomMembers.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No members in this room.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {roomMembers.map(m => (
                    <li key={m.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{m.user?.fullName || m.user?.full_name || m.user?.email || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {m.roleInRoom}</div>
                      </div>
                      <button className="danger outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={async () => {
                        try {
                          await api.delete(`/chat-rooms/${selectedRoom}/members/${m.userId}`);
                          setRoomMembers(prev => prev.filter(member => member.id !== m.id));
                        } catch (e) {
                          alert('Failed to remove member');
                        }
                      }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
