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
  const prevChatsRef = useRef([]);

  // Reproducir sonido de notificación
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio de notificación no soportado o bloqueado');
    }
  };

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
      const newChats = response.data.conversaciones || [];
      
      // Detectar si hay un nuevo mensaje (incremento en unread_count)
      if (prevChatsRef.current.length > 0) {
        let shouldPlaySound = false;
        newChats.forEach(chat => {
          const oldChat = prevChatsRef.current.find(c => c.id === chat.id);
          if (!oldChat && chat.unread_count > 0) {
            shouldPlaySound = true;
          } else if (oldChat && chat.unread_count > oldChat.unread_count) {
            shouldPlaySound = true;
          }
        });
        if (shouldPlaySound) {
          playNotificationSound();
        }
      }
      
      prevChatsRef.current = newChats;
      setChats(newChats);
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

  const renderMessageContent = (content) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Regex para detectar (Ref: #123)
      const refRegex = /\(Ref:\s*#(\d+)\)/;
      const match = line.match(refRegex);
      
      let lineContent = line;
      let refButton = null;
      
      if (match) {
        lineContent = line.replace(match[0], '').trim();
        refButton = (
          <a href={`/panel/catalogo?search=${match[1]}`} target="_blank" rel="noreferrer" 
             style={{ display: 'inline-flex', alignItems: 'center', background: '#faecee', padding: '4px 10px', borderRadius: '12px', color: '#d16b7e', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem', marginTop: '4px', gap: '6px', border: '1px solid #faecee' }}>
             <Search size={14} /> Ver Prenda Interna
          </a>
        );
      }
      
      // Parsear negritas simples *texto*
      const boldParts = lineContent.split(/\*(.*?)\*/);
      const formattedLine = boldParts.map((part, j) => {
        if (j % 2 === 1) return <strong key={j}>{part}</strong>;
        return <span key={j}>{part}</span>;
      });

      return (
        <span key={i} style={{ display: 'block', minHeight: line === '' ? '14px' : 'auto' }}>
          {formattedLine}
          {refButton && <div style={{ marginTop: '4px' }}>{refButton}</div>}
        </span>
      );
    });
  };

  return (
    <div className="page-container whatsapp-page animate-fade-in">
      <div className="page-header whatsapp-header-desktop" style={{ padding: '12px 24px', borderBottom: '1px solid #faecee', background: '#fff', margin: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0, color: '#d16b7e', fontFamily: "'Playfair Display', serif" }}>
              <MessageCircle size={20} color="#d16b7e" />
              Bandeja de Entrada
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fdf5f6', padding: '4px 8px', borderRadius: '12px', color: '#c46c7a', fontSize: '0.65rem', fontWeight: 600, border: '1px solid #faecee' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d16b7e' }}></span>
            Conectado
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
                    {renderMessageContent(msg.content)}
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
