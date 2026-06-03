#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc5ODc4MjMyLCJpYXQiOjE3Nzk4NDk0MzIsImp0aSI6ImExM2UxNjJmNGI2NTQ0NDFiMjBiNTc0OWQyZDRiYzUyIiwidXNlcl9pZCI6MX0.i9ETRvFSzDmTCMvrDl89pz7BeS3paTfrjZtTRn4uXME"
echo "=== CATEGORIAS ==="
curl -s "http://157.230.93.24/api/v1/catalogo/categorias/" -H "Authorization: Bearer $TOKEN"
echo ""
