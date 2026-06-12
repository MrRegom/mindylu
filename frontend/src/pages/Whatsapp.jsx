import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Send, Bot, User as UserIcon, Check, CheckCheck, Clock, Settings, ChevronLeft } from 'lucide-react';
import './Whatsapp.css';

const MOCK_CHATS = [
  {
    id: 1,
    name: 'María Ignacia',
    phone: '+56 9 1234 5678',
    lastMessage: 'Perfecto, nos vemos mañana a las 15:00.',
    time: '10:45 AM',
    unread: 0,
    requiresHuman: false,
    messages: [
      { id: 1, text: 'Hola, quería confirmar mi pedido del vestido negro.', sender: 'user', time: '10:40 AM' },
      { id: 2, text: '¡Hola María! Soy MindyBot 🤖. Tu pedido está confirmado para entrega mañana a las 15:00 hrs en Metro Viña del Mar. ¿Te ayudo con algo más?', sender: 'bot', time: '10:41 AM' },
      { id: 3, text: 'Perfecto, nos vemos mañana a las 15:00.', sender: 'user', time: '10:45 AM' }
    ]
  },
  {
    id: 2,
    name: 'Carolina Soto',
    phone: '+56 9 8765 4321',
    lastMessage: 'Quiero hablar con una vendedora por favor.',
    time: '09:30 AM',
    unread: 1,
    requiresHuman: true,
    messages: [
      { id: 1, text: 'Tienen talla XL de la falda de jeans?', sender: 'user', time: '09:28 AM' },
      { id: 2, text: '¡Hola Carolina! Soy MindyBot 🤖. Según nuestro catálogo, la Falda de Jeans Premium está disponible hasta la talla 42. ¿Te gustaría ver otras opciones en XL?', sender: 'bot', time: '09:29 AM' },
      { id: 3, text: 'Quiero hablar con una vendedora por favor.', sender: 'user', time: '09:30 AM' }
    ]
  },
  {
    id: 3,
    name: '+56 9 4444 5555',
    phone: '+56 9 4444 5555',
    lastMessage: 'Ayer hice una transferencia pero no me ha llegado el comprobante.',
    time: 'Ayer',
    unread: 2,
    requiresHuman: true,
    messages: [
      { id: 1, text: 'Ayer hice una transferencia pero no me ha llegado el comprobante.', sender: 'user', time: 'Ayer' }
    ]
  }
];

const Whatsapp = () => {
  const [chats, setChats] = useState(MOCK_CHATS);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    // Scroll to bottom when active chat changes or new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const newMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'human',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: inputText,
          time: newMessage.time,
          requiresHuman: false // Asumimos que al responder, ya atendimos la alerta
        };
      }
      return chat;
    }));

    setInputText('');
  };

  const handleChatClick = (id) => {
    setActiveChatId(id);
    // Mark as read
    setChats(prev => prev.map(chat => chat.id === id ? { ...chat, unread: 0 } : chat));
  };

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
            <input type="text" placeholder="Buscar clienta o número..." />
          </div>
          <div className="wa-chat-list">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                className={`wa-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => handleChatClick(chat.id)}
              >
                <div className="wa-avatar">
                  {chat.name.charAt(0).toUpperCase()}
                </div>
                <div className="wa-chat-info">
                  <div className="wa-chat-name">
                    <span>{chat.name}</span>
                    <span className="wa-chat-time" style={{ color: chat.unread > 0 ? '#25D366' : '#888' }}>
                      {chat.time}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="wa-chat-preview">
                      {chat.lastMessage}
                    </div>
                    {chat.unread > 0 && (
                      <span className="wa-badge">{chat.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="wa-main">
          {activeChat ? (
            <>
              {activeChat.requiresHuman && (
                <div className="wa-handoff-banner">
                  ⚠️ El Bot no pudo responder. Esta clienta está esperando hablar con una vendedora.
                </div>
              )}
              <div className="wa-main-header">
                <button className="wa-back-btn" onClick={() => setActiveChatId(null)}>
                  <ChevronLeft size={24} />
                </button>
                <div className="wa-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                  {activeChat.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{activeChat.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{activeChat.phone}</div>
                </div>
              </div>

              <div className="wa-chat-area">
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', margin: '16px 0', background: 'rgba(255,255,255,0.6)', padding: '4px 12px', borderRadius: '12px', alignSelf: 'center' }}>
                  Los mensajes enviados por MindyBot están marcados con 🤖
                </div>
                
                {activeChat.messages.map(msg => (
                  <div key={msg.id} className={`wa-message ${msg.sender === 'user' ? 'received' : msg.sender === 'bot' ? 'bot' : 'sent'}`}>
                    {msg.text}
                    <div className="wa-message-meta">
                      {msg.sender === 'bot' && <Bot size={12} />}
                      {msg.sender === 'human' && <UserIcon size={12} />}
                      {msg.time}
                      {msg.sender !== 'user' && <CheckCheck size={14} color="#53bdeb" />}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="wa-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje para responder manualmente..." 
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
