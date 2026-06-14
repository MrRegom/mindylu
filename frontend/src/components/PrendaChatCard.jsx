import React, { useState, useEffect } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import api from '../services/api';
import { showAlert, showToast } from '../utils/alerts';
import './PrendaChatCard.css';

const PrendaChatCard = ({ prendaId, color, talla, cantidad, clientPhone, clientName }) => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prendaData, setPrendaData] = useState(null);
  const [clientaId, setClientaId] = useState(null);
  const [varianteEncontrada, setVarianteEncontrada] = useState(null);

  useEffect(() => {
    fetchDatos();
  }, [prendaId, color, talla, clientPhone]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      // 1. Obtener datos de la prenda
      const prendaRes = await api.get(`/catalogo/prendas/${prendaId}/`);
      const prenda = prendaRes.data;
      setPrendaData(prenda);

      // 2. Encontrar la variante exacta
      let variante = null;
      if (prenda.variantes && prenda.variantes.length > 0) {
        variante = prenda.variantes.find(v => 
          v.color?.toLowerCase() === color.toLowerCase() && 
          v.talla?.toLowerCase() === talla.toLowerCase()
        );
        if (!variante) {
            // Fallback si no coincide exacto, tomar la primera
            variante = prenda.variantes[0];
        }
        setVarianteEncontrada(variante);
      }

      // 3. Obtener ID de la clienta buscando por teléfono
      const clientaRes = await api.get(`/clientas/?search=${clientPhone.replace('+', '')}`);
      const clientas = clientaRes.data.results || clientaRes.data;
      
      if (clientas && clientas.length > 0) {
        setClientaId(clientas[0].id);
      } else {
        // Si no existe, crear clienta rápida
        const newClientaRes = await api.post('/clientas/', { 
          nombre: clientName || 'Clienta WhatsApp', 
          telefono: clientPhone 
        });
        setClientaId(newClientaRes.data.id);
      }
    } catch (error) {
      console.error("Error fetching data for PrendaChatCard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSepararPrenda = async () => {
    if (!clientaId) {
      showAlert("No se pudo identificar a la clienta.");
      return;
    }
    if (!varianteEncontrada) {
      showAlert("No se encontró la variante solicitada en el catálogo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clienta_id: clientaId,
        variante_id: varianteEncontrada.id,
        cantidad: parseInt(cantidad) || 1,
        estado: 'apartado',
        notas: 'Separado desde chat WhatsApp'
      };
      
      await api.post('/pedidos/crear-desde-catalogo/', payload);
      
      showToast("¡Prenda separada con éxito!", "success");
      // Opcional: recargar variantes para actualizar stock visualmente
      fetchDatos();
    } catch (error) {
      console.error("Error al separar prenda:", error);
      showAlert(error.response?.data?.error || "Error al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="prenda-chat-card" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Loader2 className="spinner" size={24} color="var(--color-primary)" />
      </div>
    );
  }

  if (!prendaData) {
    return null;
  }

  // Buscar imagen de la variante o fallback
  let fotoUrl = prendaData.foto_url;
  if (prendaData.imagenes && prendaData.imagenes.length > 0) {
    const imgColor = prendaData.imagenes.find(img => img.color?.toLowerCase() === color.toLowerCase());
    fotoUrl = imgColor ? imgColor.imagen : prendaData.imagenes[0].imagen;
  }

  const stockDisponible = varianteEncontrada ? varianteEncontrada.cantidad : 0;
  const precio = prendaData.precio ? prendaData.precio.toLocaleString('es-CL') : '0';

  return (
    <div className="prenda-chat-card">
      <div className="prenda-chat-header">
        <img src={fotoUrl || 'https://via.placeholder.com/60'} alt={prendaData.nombre} className="prenda-chat-img" />
        <div className="prenda-chat-info">
          <h4 className="prenda-chat-title">{prendaData.nombre}</h4>
          <p className="prenda-chat-meta">{color} - {talla} x{cantidad}</p>
          <p className="prenda-chat-meta" style={{ fontWeight: 600 }}>${precio}</p>
          {stockDisponible > 0 ? (
            <p className="prenda-chat-stock disponible">{stockDisponible} en stock</p>
          ) : (
            <p className="prenda-chat-stock agotado">Agotado</p>
          )}
        </div>
      </div>
      
      <div className="prenda-chat-actions">
        <button 
          className="btn-separar-prenda" 
          onClick={handleSepararPrenda}
          disabled={isSubmitting || stockDisponible < parseInt(cantidad)}
        >
          {isSubmitting ? <Loader2 className="spinner" size={16} /> : <ShoppingBag size={16} />}
          {isSubmitting ? 'Separando...' : 'Separar Prenda (1 Clic)'}
        </button>
      </div>
    </div>
  );
};

export default PrendaChatCard;
