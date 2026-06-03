import os
import re

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'frontend', 'src')

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Si no tiene alert ni confirm, lo omitimos
    if 'alert(' not in content and 'confirm(' not in content:
        return

    print(f"Procesando {filepath}")

    # Calcular la ruta relativa para el import
    # e.g., si filepath es .../frontend/src/pages/Ajustes.jsx -> import from '../utils/alerts'
    # si es .../frontend/src/components/VenderModal.jsx -> import from '../utils/alerts'
    rel_path = os.path.relpath(filepath, FRONTEND_DIR)
    depth = rel_path.count(os.sep)
    if depth == 0:
        import_path = './utils/alerts'
    else:
        import_path = '../' * depth + 'utils/alerts'

    # Agregar el import si no está
    if 'import { showAlert, showConfirm, showToast }' not in content:
        # Ponerlo justo después del último import
        imports_end = content.rfind('import ')
        if imports_end != -1:
            end_line = content.find('\n', imports_end)
            content = content[:end_line+1] + f"import {{ showAlert, showConfirm, showToast }} from '{import_path}';\n" + content[end_line+1:]
        else:
            content = f"import {{ showAlert, showConfirm, showToast }} from '{import_path}';\n" + content

    # Reemplazar alert(...) por showToast(...) para errores/éxito, o showAlert. 
    # Generalmente alert(error...) -> showAlert(error..., 'error')
    # Pero para no romper la lógica, usamos showToast por defecto para no bloquear la pantalla, 
    # o showAlert si es importante. Vamos a reemplazar todo `alert(` por `showAlert(`.
    content = re.sub(r'\balert\(', 'showAlert(', content)
    content = re.sub(r'window\.alert\(', 'showAlert(', content)

    # Reemplazar confirm(...)
    # Si tenemos `if (window.confirm("..."))` o `if (!window.confirm("..."))`
    # Esto es peligroso porque showConfirm es async.
    # En la mayoría de los casos de esta app están dentro de funciones async, e.g. handleDelete = async ...
    # Entonces reemplazamos `window.confirm(...)` por `await showConfirm(...)`
    content = re.sub(r'window\.confirm\(', 'await showConfirm(', content)
    content = re.sub(r'\bconfirm\(', 'await showConfirm(', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            process_file(os.path.join(root, file))

print("✅ Alertas reemplazadas")
