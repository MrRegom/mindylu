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

            # --- 1. MARCA DE AGUA DE TEXTO (Repetida y transparente) ---
            try:
                text_watermark = "Lu Prenditas\nBY MINDY PALACIOS"
                # Tamaño de fuente más pequeño
                wm_font_size = max(int(img_width * 0.05), 18)
                
                try:
                    wm_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", wm_font_size)
                except IOError:
                    wm_font = ImageFont.load_default()

                dummy_draw = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
                
                # Para centrar el texto multilinea
                lines = text_watermark.split('\n')
                max_width = 0
                total_height = 0
                for line in lines:
                    bbox = dummy_draw.textbbox((0, 0), line, font=wm_font)
                    w = bbox[2] - bbox[0]
                    h = bbox[3] - bbox[1]
                    if w > max_width: max_width = w
                    total_height += h + 10 # 10px de espaciado

                txt_img = Image.new('RGBA', (max_width + 40, total_height + 40), (255, 255, 255, 0))
                txt_draw = ImageDraw.Draw(txt_img)
                
                # Dibujar texto centrado
                current_y = 20
                for line in lines:
                    bbox = dummy_draw.textbbox((0, 0), line, font=wm_font)
                    w = bbox[2] - bbox[0]
                    x = 20 + (max_width - w) / 2
                    txt_draw.text((x, current_y), line, font=wm_font, fill=(255, 255, 255, 110))
                    current_y += (bbox[3] - bbox[1]) + 10
                
                txt_rotated = txt_img.rotate(30, expand=True)
                rw, rh = txt_rotated.size
                
                # Pegar en grilla más junta (para que cubra toda la foto con un patrón chico)
                step_x = int(rw * 1.3)
                step_y = int(rh * 1.6)
                
                for x in range(-rw, img_width + rw, step_x):
                    for y in range(-rh, img_height + rh, step_y):
                        offset_x = x if (y // step_y) % 2 == 0 else x + int(step_x * 0.5)
                        overlay.paste(txt_rotated, (int(offset_x), y), txt_rotated)
                        
            except Exception as e:
                print(f"No se pudo estampar el texto de agua: {e}")
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
