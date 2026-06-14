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
            
            # Crear una capa transparente para la marca de agua y el recuadro
            overlay = Image.new('RGBA', img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)
            img_width, img_height = img.size

            # --- 1. MARCA DE AGUA DEL LOGO (Repetida y transparente) ---
            try:
                from django.conf import settings
                logo_path = os.path.join(settings.BASE_DIR, 'img', 'lulogo.png')
                if os.path.exists(logo_path):
                    logo = Image.open(logo_path).convert("RGBA")
                    # Escalar el logo a un 25% del ancho de la foto
                    logo_width = int(img_width * 0.25)
                    aspect_ratio = logo.size[1] / logo.size[0]
                    logo_height = int(logo_width * aspect_ratio)
                    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
                    
                    # Reducir opacidad (ej. 35% para que se note más)
                    alpha = logo.split()[3]
                    alpha = alpha.point(lambda p: p * 0.35)
                    logo.putalpha(alpha)
                    
                    # Rotar un poco la marca de agua
                    logo_rotated = logo.rotate(30, expand=True)
                    lw, lh = logo_rotated.size
                    
                    # Pegar en grilla
                    for x in range(-lw, img_width + lw, int(lw * 1.5)):
                        for y in range(-lh, img_height + lh, int(lh * 1.5)):
                            # Desfase en filas intercaladas
                            offset_x = x if (y // int(lh * 1.5)) % 2 == 0 else x + int(lw * 0.75)
                            overlay.paste(logo_rotated, (int(offset_x), y), logo_rotated)
            except Exception as e:
                print(f"No se pudo estampar el logo de agua: {e}")
            # -----------------------------------------------------------

            # --- 2. PRECIO (Estilo elegante) ---
            text_precio = f"${precio:,.0f}".replace(',', '.')
            if talla:
                texto_completo = f"Talla {talla}\n{text_precio}"
            else:
                texto_completo = text_precio

            # Tamaño de fuente basado en la altura
            font_size = max(int(img_height * 0.045), 24)
            
            try:
                # Intentar cargar Arial Bold en Windows, si no, fallback
                font = ImageFont.truetype("arialbd.ttf", font_size)
            except IOError:
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                except IOError:
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except IOError:
                        font = ImageFont.load_default()

            # Calcular tamaño del texto
            bbox = draw.textbbox((0, 0), texto_completo, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            padding_x = int(font_size * 1.2)
            padding_y = int(font_size * 0.8)
            
            # Posición inferior izquierda
            margin = int(img_width * 0.04)
            box_x0 = margin
            box_y0 = img_height - text_height - margin - (padding_y * 2)
            box_x1 = box_x0 + text_width + (padding_x * 2)
            box_y1 = box_y0 + text_height + (padding_y * 2)

            # Sombra del recuadro
            draw.rounded_rectangle(
                [box_x0 + 6, box_y0 + 6, box_x1 + 6, box_y1 + 6],
                radius=15,
                fill=(0, 0, 0, 100)
            )
            
            # Recuadro principal (Fondo oscuro elegante con borde sutil claro)
            draw.rounded_rectangle(
                [box_x0, box_y0, box_x1, box_y1],
                radius=15,
                fill=(20, 16, 18, 220), # Gris oscuro/negro con un toque cálido y translúcido
                outline=(255, 240, 245, 180), # Borde clarito (blanco/rosado tenue)
                width=3
            )
            
            # Dibujar texto centrado en el recuadro
            text_x = box_x0 + padding_x
            text_y = box_y0 + padding_y
            draw.text((text_x, text_y), texto_completo, font=font, fill=(255, 255, 255), align="center")
            # -----------------------------------
            
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
