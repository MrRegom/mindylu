import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Send, Bot, User as UserIcon, Check, CheckCheck, Clock, Settings, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import './Whatsapp.css';

const Whatsapp = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Poll conversations every 5 seconds
  useEffect(() => {
    fetchConversaciones();
    const interval = setInterval(fetchConversaciones, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when a chat is selected or poll active chat
  useEffect(() => {
    if (activeChatId) {
      fetchMensajes(activeChatId);
      const interval = setInterval(() => fetchMensajes(activeChatId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeChatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversaciones = async () => {
    try {
      const response = await api.get('integraciones/whatsapp/conversaciones/');
      setChats(response.data.conversaciones || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMensajes = async (chatId) => {
    try {
      const response = await api.get(`integraciones/whatsapp/conversaciones/${chatId}/mensajes/`);
      setMessages(response.data.mensajes || []);
      // Optimistically clear unread count for this chat in the sidebar
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const textToSend = inputText;
    setInputText('');

    // Optimistic UI update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      direction: 'OUTBOUND',
      content: textToSend,
      status: 'sent',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await api.post(`integraciones/whatsapp/conversaciones/${activeChatId}/enviar/`, {
        content: textToSend
      });
      // Refresh to get the real message ID and updated status
      fetchMensajes(activeChatId);
      fetchConversaciones();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error (optional, or mark as failed)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      alert('Error al enviar el mensaje. La clienta debe haberte hablado en las últimas 24 horas.');
    }
  };

  const handleChatClick = (id) => {
    setActiveChatId(id);
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  
  const filteredChats = chats.filter(chat => 
    (chat.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.client_phone || '').includes(searchQuery)
  );

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 0 }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>
              <MessageCircle size={28} />
              Bandeja de Entrada (Meta API)
            </h1>
            <p className="subtitle">Responde a tus clientas cuando el Bot necesite tu ayuda.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#d9fdd3', padding: '6px 12px', borderRadius: '20px', color: '#0f5132', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#198754' }}></span>
            Webhook Conectado
          </div>
        </div>
      </div>

      <div className={`whatsapp-container ${activeChatId ? 'chat-active' : ''}`}>
        {/* Sidebar */}
        <div className="wa-sidebar">
          <div className="wa-sidebar-header">
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Chats</h3>
            <Settings size={20} style={{ color: '#666', cursor: 'pointer' }} />
          </div>
          <div className="wa-search-bar">
            <input 
              type="text" 
              placeholder="Buscar clienta o número..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="wa-chat-list">
            {filteredChats.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                No hay conversaciones aún.
              </div>
            )}
            {filteredChats.map(chat => {
              const displayName = chat.client_name !== 'Desconocido' ? chat.client_name : chat.client_phone;
              return (
                <div 
                  key={chat.id} 
                  className={`wa-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="wa-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="wa-chat-info">
                    <div className="wa-chat-name">
                      <span>{displayName}</span>
                      <span className="wa-chat-time" style={{ color: chat.unread_count > 0 ? '#25D366' : '#888' }}>
                        {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="wa-chat-preview">
                        {chat.last_message_content || 'Nuevo chat'}
                      </div>
                      {chat.unread_count > 0 && (
                        <span className="wa-badge">{chat.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="wa-main">
          {activeChat ? (
            <>
              {activeChat.status === 'OPEN' && activeChat.unread_count > 0 && (
                <div className="wa-handoff-banner">
                  Nuevos mensajes recibidos
                </div>
              )}
              <div className="wa-main-header">
                <button className="wa-back-btn" onClick={() => setActiveChatId(null)}>
                  <ChevronLeft size={24} />
                </button>
                <div className="wa-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                  {(activeChat.client_name !== 'Desconocido' ? activeChat.client_name : activeChat.client_phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>
                    {activeChat.client_name !== 'Desconocido' ? activeChat.client_name : activeChat.client_phone}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{activeChat.client_phone}</div>
                </div>
              </div>

              <div className="wa-chat-area">
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', margin: '16px 0', background: 'rgba(255,255,255,0.6)', padding: '4px 12px', borderRadius: '12px', alignSelf: 'center' }}>
                  Mensajes cifrados de extremo a extremo
                </div>
                
                {messages.map(msg => (
                  <div key={msg.id} className={`wa-message ${msg.direction === 'INBOUND' ? 'received' : 'sent'}`}>
                    {msg.content}
                    <div className="wa-message-meta">
                      {msg.direction === 'OUTBOUND' && <UserIcon size={12} />}
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.direction === 'OUTBOUND' && <CheckCheck size={14} color="#53bdeb" />}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="wa-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()}>
                  <Send size={20} style={{ marginLeft: '4px' }} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              <div style={{ width: 120, height: 120, background: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <MessageCircle size={64} color="#fff" />
              </div>
              <h2 style={{ color: '#555', fontWeight: 300 }}>MindyLu WhatsApp</h2>
              <p>Selecciona un chat para comenzar a responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Whatsapp;
