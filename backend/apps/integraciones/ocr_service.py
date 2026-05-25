import re
import logging
import requests
from decouple import config
try:
    from PIL import Image
    import pytesseract
except ImportError:
    pass

logger = logging.getLogger(__name__)

API_RATE_LIMITED = False

def extract_data_from_image(image_path_or_file):
    global API_RATE_LIMITED
    
    # 1. Intentar usar la API gratuita en la nube de OCR.space para lectura real sin instalar binarios locales
    if not API_RATE_LIMITED:
        try:
            # Asegurarse de que el puntero del archivo esté al inicio si es un BytesIO
            if hasattr(image_path_or_file, 'seek'):
                image_path_or_file.seek(0)
                
            api_key = config('OCR_SPACE_API_KEY', default='helloworld')
            payload = {
                'apikey': api_key,
                'language': 'spa',
                'isOverlayRequired': False
            }
            
            files = {
                'file': ('image.jpg', image_path_or_file, 'image/jpeg')
            }
            
            # Consultar la API en la nube
            response = requests.post('https://api.ocr.space/parse/image', data=payload, files=files, timeout=5)
            
            if response.status_code == 429:
                API_RATE_LIMITED = True
                
            response.raise_for_status()
            result = response.json()
        
            parsed_results = result.get('ParsedResults', [])
            if parsed_results:
                text = parsed_results[0].get('ParsedText', '')
                
                # Buscar precio con regex con formato chileno (ej: 18.990 o 18,990)
                precio_match = re.search(r'(\d{1,3}(?:\.\d{3})+)', text)
                precio = None
                if precio_match:
                    precio_str = precio_match.group(1).replace('.', '').replace(',', '')
                    precio = int(precio_str)
                else:
                    # Buscar números sueltos de 4 o 5 dígitos (ej: 7990 o 18990)
                    precio_match_simple = re.search(r'\b(\d{4,5})\b', text)
                    if precio_match_simple:
                        precio = int(precio_match_simple.group(1))
                
                # Si logramos extraer texto real, lo retornamos
                if text.strip():
                    return {
                        'texto_completo': text,
                        'precio_sugerido': precio or 0,
                        'error': None
                    }
        except Exception as e:
            logger.error(f"Error OCR Cloud API: {e}")

    # 2. Fallback de respaldo usando Tesseract local si el desarrollador decide instalarlo
    try:
        if 'pytesseract' in globals():
            if hasattr(image_path_or_file, 'seek'):
                image_path_or_file.seek(0)
            # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            image = Image.open(image_path_or_file)
            text = pytesseract.image_to_string(image, lang='spa')
            
            precio_match = re.search(r'\$?(\d{1,3}(?:[.,]\d{3})*)', text)
            precio = None
            if precio_match:
                precio_str = precio_match.group(1).replace('.', '').replace(',', '')
                precio = int(precio_str)
                
            return {
                'texto_completo': text,
                'precio_sugerido': precio,
                'error': None
            }
        else:
            raise ImportError("pytesseract no está instalado.")
    except Exception as e:
        logger.error(f"Error Tesseract local: {e}")
        
        # 3. Fallback estático de seguridad si todo lo demás falla
        return {
            'texto_completo': '',
            'precio_sugerido': 0,
            'error': 'API en la nube y Tesseract no disponibles.'
        }
