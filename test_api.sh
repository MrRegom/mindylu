#!/bin/bash
TOKEN=$(curl -s -X POST http://157.230.93.24/api/v1/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindylu.com","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access','ERROR:'+str(d)))")

echo "TOKEN=$TOKEN"
echo ""
echo "Categorias:"
curl -s http://157.230.93.24/api/v1/catalogo/categorias/ \
  -H "Authorization: Bearer $TOKEN"
