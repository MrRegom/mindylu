#!/bin/bash
echo "Login con admin@mindylu.com..."
RESPONSE=$(curl -s -X POST http://157.230.93.24/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindylu.com","password":"admin123"}')
echo "Respuesta login: $RESPONSE"

TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access', d.get('access_token','NO_TOKEN')))" 2>/dev/null)
echo "Token extraido: $TOKEN"

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NO_TOKEN" ]; then
  echo ""
  echo "Categorias:"
  curl -s "http://157.230.93.24/api/v1/catalogo/categorias/" \
    -H "Authorization: Bearer $TOKEN"
fi
