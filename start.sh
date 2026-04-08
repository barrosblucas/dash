#!/bin/bash

# Script para iniciar o Dashboard Financeiro Municipal
# Prefeitura de Bandeirantes MS

echo "============================================================"
echo "Iniciando Dashboard Financeiro Municipal"
echo "Prefeitura de Bandeirantes MS"
echo "============================================================"

# Parar processos existentes
echo "Parando processos existentes..."
pkill -f "uvicorn backend.api.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Iniciar Backend (FastAPI)
echo "Iniciando Backend API..."
cd /home/thanos/dashboard
backend/venv/bin/uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --app-dir . > /tmp/backend_api.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

# Verificar se Backend está rodando
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "Backend: OK (http://localhost:8000)"
else
    echo "Backend: ERRO - Verifique /tmp/backend_api.log"
    tail -20 /tmp/backend_api.log
    exit 1
fi

# Iniciar Frontend (Next.js)
echo "Iniciando Frontend Next.js..."
cd /home/thanos/dashboard/frontend
npm run dev > /tmp/frontend_next.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 5

# Verificar se Frontend está rodando
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend: OK (http://localhost:3000)"
else
    echo "Frontend: ERRO - Verifique /tmp/frontend_next.log"
    tail -20 /tmp/frontend_next.log
    exit 1
fi

echo ""
echo "============================================================"
echo "Dashboard iniciado com sucesso!"
echo "============================================================"
echo ""
echo "Backend API: http://localhost:8000"
echo "Backend Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo ""
echo "Logs:"
echo "  Backend: /tmp/backend_api.log"
echo "  Frontend: /tmp/frontend_next.log"
echo ""
echo "Para parar:"
echo "  kill $BACKEND_PID $FRONTEND_PID"