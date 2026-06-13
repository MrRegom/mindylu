import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, ArrowUp, X } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true para evitar parpadeo
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect mobile
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Detect if already installed / standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Listen for install prompt on Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Solo mostrar si es móvil y NO está en modo standalone (instalado)
  if (!isMobile || isStandalone) return null;

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-card animate-slide-up">
        <div className="pwa-logo">MindyLu<span>.</span></div>
        <h2>Instala la aplicación</h2>
        <p>Para una experiencia rápida, fluida y pantalla completa, por favor instala MindyLu en tu dispositivo.</p>
        
        {isIOS ? (
          <div className="ios-instructions">
            <p><strong>En tu iPhone / iPad:</strong></p>
            <ol>
              <li>Toca el botón <strong>Compartir</strong> <Share size={16} style={{display:'inline', verticalAlign:'middle'}} /> en la barra de navegación.</li>
              <li>Desliza hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong> <PlusSquare size={16} style={{display:'inline', verticalAlign:'middle'}} />.</li>
            </ol>
            <div className="ios-arrow-hint">
              <ArrowUp size={32} />
            </div>
          </div>
        ) : (
          <button 
            className="btn-install-pwa" 
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
          >
            <Download size={20} />
            Instalar MindyLu
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
