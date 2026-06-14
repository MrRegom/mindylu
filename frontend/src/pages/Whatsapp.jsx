import { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, Search, Send, Bot, User as UserIcon, Check, CheckCheck, Clock, Settings, ChevronLeft, Trash2, X } from 'lucide-react';
import { GlobalContext } from '../contexts/GlobalContext';
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
  const activeChatRef = useRef(activeChatId);

  const [replyingTo, setReplyingTo] = useState(null);
  const [swipeDeleteId, setSwipeDeleteId] = useState(null);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);

  const handleChatTouchMove = (e, chatId) => {
    if (!touchStart) return;
    const diff = touchStart - e.targetTouches[0].clientX;
    if (diff > 50) setSwipeDeleteId(chatId);
    else if (diff < -50) setSwipeDeleteId(null);
  };

  const handleMsgTouchMove = (e, msg) => {
    if (!touchStart) return;
    const diff = touchStart - e.targetTouches[0].clientX;
    if (diff < -50) {
      setReplyingTo(msg);
      setTouchStart(0);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await api.delete(`integraciones/whatsapp/conversaciones/${chatId}/`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat', error);
    }
  };

  // Sync activeChatRef with activeChatId
  useEffect(() => {
    activeChatRef.current = activeChatId;
  }, [activeChatId]);

  const { wsMessage, fetchUnreadCount } = useContext(GlobalContext);

  // Initial fetch
  useEffect(() => {
    fetchConversaciones();
    if (activeChatRef.current) {
      fetchMensajes(activeChatRef.current);
    }
  }, []);

  // Handle incoming global wsMessage
  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'chat_message') {
      const data = wsMessage.data;
      
      setChats(prevChats => {
        const chatExists = prevChats.some(c => c.id === data.conversacion_id);
        let newChats;
        if (chatExists) {
          newChats = prevChats.map(c => {
            if (c.id === data.conversacion_id) {
              return {
                ...c,
                unread_count: data.unread_count,
                last_message_content: data.mensaje.content,
                last_message_at: data.mensaje.created_at,
                client_name: data.client_name
              };
            }
            return c;
          });
        } else {
          newChats = [{
            id: data.conversacion_id,
            client_phone: data.client_phone,
            client_name: data.client_name,
            unread_count: data.unread_count,
            last_message_content: data.mensaje.content,
            last_message_at: data.mensaje.created_at,
            status: 'OPEN'
          }, ...prevChats];
        }
        return newChats.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
      });

      if (activeChatRef.current === data.conversacion_id) {
        setMessages(prevMsgs => {
          if (prevMsgs.some(m => m.id === data.mensaje.id)) return prevMsgs;
          return [...prevMsgs, data.mensaje];
        });
        
        // If we are looking at this chat, we should probably mark it as read immediately!
        // We can just call fetchUnreadCount to re-sync if needed, but the backend handles read receipt via `api.get(/mensajes/)`
        if (data.mensaje.direction === 'INBOUND') {
          // Si estamos viendo el chat, los mensajes se leen de inmediato
          api.get(`/integraciones/whatsapp/conversaciones/${data.conversacion_id}/mensajes/`).then(() => {
            fetchUnreadCount(); // update global badge
            // update local chat unread count
            setChats(prev => prev.map(c => c.id === data.conversacion_id ? { ...c, unread_count: 0 } : c));
          });
        }
      }
    }
  }, [wsMessage, fetchUnreadCount]);

  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // Web Push Notifications Registration
  useEffect(() => {
    const registerPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const swReg = await navigator.serviceWorker.ready;
          const subscription = await swReg.pushManager.getSubscription();
          
          if (!subscription) {
            // No estamos suscritos, pedir permiso y suscribir
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const res = await api.get('integraciones/webpush/vapid-public-key/');
              const publicVapidKey = res.data.public_key;
              
              if (publicVapidKey) {
                const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);
                const newSubscription = await swReg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey
                });
                
                // Enviar al backend
                await api.post('integraciones/webpush/subscribe/', newSubscription);
              }
            }
          } else {
            // Ya estamos suscritos, igual mandamos el endpoint al backend por si acaso
            await api.post('integraciones/webpush/subscribe/', subscription);
          }
        } catch (error) {
          console.error("Error al registrar Push Notifications:", error);
        }
      }
    };
    
    registerPush();
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (activeChatId) {
      fetchMensajes(activeChatId);
      // Removed polling since WebSockets will handle updates
    }
  }, [activeChatId]);

  // Fetch suggestions whenever messages change for the active chat
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      // Check if the last message is inbound
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.direction === 'INBOUND') {
        fetchSuggestions(activeChatId);
      } else {
        setSuggestedProducts([]); // Clear if we replied
      }
    } else {
      setSuggestedProducts([]);
    }
  }, [messages, activeChatId]);

  const fetchSuggestions = async (chatId) => {
    try {
      const response = await api.get(`integraciones/whatsapp/conversaciones/${chatId}/sugerencias/`);
      setSuggestedProducts(response.data.sugerencias || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

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

  const handleSendMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputText;
    if (!textToSend.trim() || !activeChatId) return;

    if (!directText) {
      setInputText('');
    }

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
        content: textToSend,
        reply_to: replyingTo ? replyingTo.wam_id : null
      });
      setReplyingTo(null);
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
                <div key={chat.id} style={{ position: 'relative', overflow: 'hidden' }}>
                  <div 
                    className={`wa-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleChatClick(chat.id)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={(e) => handleChatTouchMove(e, chat.id)}
                    style={{ transform: swipeDeleteId === chat.id ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform 0.3s', position: 'relative', zIndex: 2, background: '#fff' }}
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
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '80px', background: '#ea0038', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, cursor: 'pointer' }} onClick={(e) => handleDeleteChat(e, chat.id)}>
                    <Trash2 size={24} />
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
                  <div 
                    key={msg.id} 
                    className={`wa-message ${msg.direction === 'INBOUND' ? 'received' : 'sent'}`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={(e) => handleMsgTouchMove(e, msg)}
                  >
                    {renderMessageContent(msg.content)}
                    <div className="wa-message-meta">
                      {msg.direction === 'OUTBOUND' && <UserIcon size={12} />}
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.direction === 'OUTBOUND' && <CheckCheck size={14} color="#53bdeb" />}
                    </div>
                    {/* Quick Action Buttons para Intención de Compra */}
                    {msg.direction === 'INBOUND' && msg.content.toLowerCase().includes("quiero comprar los siguientes") && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleSendMessage(null, "¡Hola linda! ✨ Sí, lo tengo disponible. ¿Te gustaría coordinar la entrega o retiro?")}
                          style={{ background: '#dcf8c6', border: '1px solid #7cb342', color: '#33691e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✅ Disponible
                        </button>
                        <button 
                          onClick={() => handleSendMessage(null, "¡Hola linda! 🥺 Pucha, justo se me agotó ese modelo. ¿Te gustaría que te muestre otras opciones hermosas que tengo?")}
                          style={{ background: '#ffcdd2', border: '1px solid #e53935', color: '#b71c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ❌ Agotado
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {suggestedProducts.length > 0 && (
                <div className="wa-suggestions">
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px', paddingLeft: '8px' }}>
                    Sugerencias (basado en mensaje del cliente):
                  </div>
                  <div className="wa-suggestions-list">
                    {suggestedProducts.map(p => (
                      <div key={p.id} className="wa-suggestion-card">
                        <img src={p.imagen || 'https://via.placeholder.com/60'} alt={p.nombre} />
                        <div className="wa-suggestion-info">
                          <div className="wa-suggestion-name">{p.nombre}</div>
                          <div className="wa-suggestion-price">${p.precio}</div>
                          <div className="wa-suggestion-stock">{p.stock_info}</div>
                        </div>
                        <button 
                          className="wa-suggestion-send" 
                          onClick={() => setInputText(`Mira este modelo: *${p.nombre}* a $${p.precio}.\nDisponibilidad: ${p.stock_info}\nVer catálogo: ${window.location.origin}`)}
                        >
                          Enviar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="wa-quick-replies">
                <button type="button" className="wa-quick-reply-btn" onClick={() => setInputText(inputText + "🏦 *Datos Bancarios*\nBanco Estado\nCuenta Rut\n11.111.111-1\nMindy Lu\ncorreo@mindylu.com")}>
                  🏦 Datos Bancarios
                </button>
                <button type="button" className="wa-quick-reply-btn" onClick={() => setInputText(inputText + "🚚 *Entregas*\nRealizamos entregas presenciales a convenir y envíos a todo Chile vía Starken o Chilexpress.")}>
                  🚚 Entregas
                </button>
                <button type="button" className="wa-quick-reply-btn" onClick={() => setInputText(inputText + "👗 *Catálogo*\nRevisa todas nuestras prendas disponibles aquí: " + window.location.origin)}>
                  👗 Catálogo
                </button>
                <button type="button" className="wa-quick-reply-btn" onClick={() => setInputText(inputText + "¡Hola hermosa! ✨ ¿En qué te puedo ayudar?")}>
                  ✨ Saludo
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                {replyingTo && (
                  <div style={{ background: '#f0f0f0', borderLeft: '4px solid #25D366', padding: '8px 12px', margin: '0 12px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#555' }}>
                      <strong style={{ color: '#25D366' }}>Respondiendo a:</strong> {replyingTo.content}
                    </div>
                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
                <form className="wa-input-area" onSubmit={handleSendMessage} style={replyingTo ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}}>
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
              </div>
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
