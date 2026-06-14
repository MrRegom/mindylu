import os
from PIL import Image, ImageDraw, ImageFont
import tempfile
import uuid

class WatermarkService:
    @staticmethod
    def estampar_precio(image_path, precio, talla=None, color_bg=(0, 0, 0, 180), color_text=(255, 255, 255)):
        """
        Dibuja un recuadro oscuro semitransparente con el precio y talla sobre la imagen.
        """
        try:
            # Abrir imagen
            img = Image.open(image_path).convert("RGBA")
            
            # Crear una capa transparente para el recuadro
            overlay = Image.new('RGBA', img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)
            
            # Textos
            text_precio = f"${precio:,.0f}".replace(',', '.')
            if talla:
                texto_completo = f"Talla {talla}\n{text_precio}"
            else:
                texto_completo = text_precio

            # Determinar tamaño de fuente basado en la altura de la imagen (aprox 5% de la altura)
            img_width, img_height = img.size
            font_size = max(int(img_height * 0.05), 20)
            
            try:
                # Intentar cargar una fuente bonita (Roboto/Arial) si está disponible en el sistema
                # Ubuntu: /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
                # Windows: arial.ttf
                font = ImageFont.truetype("arial.ttf", font_size)
            except IOError:
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                except IOError:
                    font = ImageFont.load_default()

            # Calcular tamaño del texto
            bbox = draw.textbbox((0, 0), texto_completo, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Padding del recuadro
            padding_x = int(font_size * 0.8)
            padding_y = int(font_size * 0.6)
            
            # Posición (Esquina inferior izquierda, con un pequeño margen)
            margin = int(img_width * 0.03)
            box_x0 = margin
            box_y0 = img_height - text_height - margin - (padding_y * 2)
            box_x1 = box_x0 + text_width + (padding_x * 2)
            box_y1 = box_y0 + text_height + (padding_y * 2)

            # Dibujar rectángulo redondeado semitransparente
            draw.rounded_rectangle(
                [box_x0, box_y0, box_x1, box_y1],
                radius=10,
                fill=color_bg
            )
            
            # Dibujar texto centrado en el recuadro
            text_x = box_x0 + padding_x
            text_y = box_y0 + padding_y
            draw.text((text_x, text_y), texto_completo, font=font, fill=color_text)

            # --- NUEVO: Estampar el logo (lulogo.png) ---
            # Posicionar el logo en la esquina superior izquierda
            try:
                from django.conf import settings
                logo_path = os.path.join(settings.BASE_DIR, 'img', 'lulogo.png')
                if os.path.exists(logo_path):
                    logo = Image.open(logo_path).convert("RGBA")
                    # Escalar el logo a un 15% del ancho de la foto original
                    logo_width = int(img_width * 0.15)
                    aspect_ratio = logo.size[1] / logo.size[0]
                    logo_height = int(logo_width * aspect_ratio)
                    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
                    
                    # Pegar el logo en la imagen original (top left corner with margin)
                    overlay.paste(logo, (margin, margin), logo)
            except Exception as e:
                print(f"No se pudo estampar el logo: {e}")
            # --------------------------------------------
            
            # Combinar capas
            img_result = Image.alpha_composite(img, overlay).convert("RGB")
            
            # Guardar en archivo temporal
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, f"watermarked_{uuid.uuid4().hex}.jpg")
            img_result.save(temp_path, "JPEG", quality=90)
            
            return temp_path

        except Exception as e:
            print(f"Error estampando marca de agua: {e}")
            return None
