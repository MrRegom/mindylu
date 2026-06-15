import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import './LuBot.css';

const MOCK_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200";

export const LuBot = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const messagesEndRef = useRef(null);

  const phoneNumber = config?.whatsapp_numero || "56933075784";
  
  const PREDEFINED_QUESTIONS = [
    { id: 'opcion_1', text: config?.bot_opcion_1 || '¿Hacen entregas por delivery?' },
    { id: 'opcion_2', text: config?.bot_opcion_2 || 'Quiero preguntar por prendas' },
    { id: 'hablar_lu', text: config?.bot_opcion_3 || 'Quiero hablar directo con Lu 💕' }
  ].filter(q => q.text.trim() !== '');

  const PREDEFINED_ANSWERS = {
    opcion_1: config?.bot_respuesta_1 || "¡Hola Linda! Sí, hacemos envíos a todo Chile vía Starken o Chilexpress por pagar. Además, tenemos entregas presenciales en puntos céntricos coordinados previamente. ¿Te gustaría saber algo más?",
    opcion_2: config?.bot_respuesta_2 || "¡Me encantan! Todas nuestras prendas están en el catálogo. Si buscas tallas o colores específicos, fíjate en los detalles de cada producto. Algunas prendas son exclusivas y de stock limitado. ¡Si quieres ver algo más, dímelo!",
  };

  useEffect(() => {
    // Set initial welcome message
    setMessages([
      { 
        id: 1, 
        text: config?.bot_mensaje_bienvenida || "¡Hola, hermosa! 👋 Soy LuBot. ¿En qué te puedo ayudar hoy?", 
        sender: 'bot', 
        timestamp: new Date() 
      }
    ]);
  }, [config]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleOptionClick = (option) => {
    // Add user message
    const userMsg = { id: Date.now(), text: option.text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setShowOptions(false);

    if (option.id === 'hablar_lu') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1, 
          text: "¡Perfecto! Te redirigiré ahora mismo. Haz clic en el botón de abajo para ir a WhatsApp.", 
          sender: 'bot', 
          timestamp: new Date(),
          isAction: true
        }]);
      }, 1000);
      return;
    }

    // Bot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, 
        text: PREDEFINED_ANSWERS[option.id], 
        sender: 'bot', 
        timestamp: new Date()
      }]);
      // Show options again after response
      setTimeout(() => setShowOptions(true), 500);
    }, 1500);
  };

  const openWhatsApp = () => {
    const text = 'Hola Lu! Vengo de la página web y me gustaría hacerte una consulta.';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="lubot-container">
      {/* Floating Button */}
      <button 
        className={`lubot-fab ${isOpen ? 'lubot-fab-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="lubot-fab-icon">
          <MessageCircle size={28} />
          <span className="lubot-badge">1</span>
        </div>
      </button>

      {/* Chat Window */}
      <div className={`lubot-window ${isOpen ? 'open' : ''}`}>
        <div className="lubot-header">
          <div className="lubot-header-profile">
            <div className="lubot-avatar-wrapper">
              <img src={MOCK_AVATAR} alt="LuBot Avatar" className="lubot-avatar" />
              <div className="lubot-online-dot"></div>
            </div>
            <div>
              <h3 className="lubot-title">Lu Prenditas</h3>
              <p className="lubot-subtitle">Asistente Virtual</p>
            </div>
          </div>
          <button className="lubot-close-btn" onClick={() => setIsOpen(false)}>
            <ChevronDown size={24} />
          </button>
        </div>

        <div className="lubot-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`lubot-message-row ${msg.sender}`}>
              {msg.sender === 'bot' && <img src={MOCK_AVATAR} className="lubot-msg-avatar" alt="bot" />}
              <div className="lubot-message-content">
                <div className={`lubot-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
                {msg.isAction && (
                  <button className="lubot-action-btn" onClick={openWhatsApp}>
                    Abrir WhatsApp
                  </button>
                )}
                <span className="lubot-time">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="lubot-message-row bot">
              <img src={MOCK_AVATAR} className="lubot-msg-avatar" alt="bot" />
              <div className="lubot-bubble bot typing">
                <div className="dot-typing"></div>
              </div>
            </div>
          )}

          {showOptions && !isTyping && (
            <div className="lubot-options-container">
              {PREDEFINED_QUESTIONS.map(opt => (
                <button key={opt.id} className="lubot-option-btn" onClick={() => handleOptionClick(opt)}>
                  {opt.text}
                </button>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
