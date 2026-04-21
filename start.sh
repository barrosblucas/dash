#!/bin/bash

# Script para iniciar o Dashboard Financeiro Municipal
# Prefeitura de Bandeirantes MS

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================================"
echo "Iniciando Dashboard Financeiro Municipal"
echo "Prefeitura de Bandeirantes MS"
echo "============================================================"

# Parar processos existentes
echo "Parando processos existentes..."
pkill -f "uvicorn backend.api.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Verificar se venv existe
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo "Erro: venv não encontrado em $PROJECT_DIR/venv"
    echo ""
    echo "Para configurar:"
    echo "  sudo apt install python3.12-venv"
    echo "  python3 -m venv $PROJECT_DIR/venv"
    echo "  source $PROJECT_DIR/venv/bin/activate"
    echo "  pip install -r $PROJECT_DIR/backend/requirements.txt"
    echo ""
    echo "Alternativa: use Docker Compose:"
    echo "  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build"
    exit 1
fi

# Iniciar Backend (FastAPI)
echo "Iniciando Backend API..."
cd "$PROJECT_DIR"
source venv/bin/activate
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload --log-level info > /tmp/backend_api.log 2>&1 &
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

# Instalar dependências do frontend se necessário
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo "Instalando dependências do frontend..."
    cd "$PROJECT_DIR/frontend" && npm install && cd "$PROJECT_DIR"
fi

# Iniciar Frontend (Next.js)
echo "Iniciando Frontend Next.js..."
cd "$PROJECT_DIR/frontend"
npx next dev --port 3000 --hostname 0.0.0.0 > /tmp/frontend_next.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 10

# Verificar se Frontend está rodando
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend: OK (http://localhost:3000)"
else
    echo "Frontend: VERIFICANDO..."
    sleep 5
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Frontend: OK (http://localhost:3000)"
    else
        echo "Frontend: ERRO - Verifique /tmp/frontend_next.log"
        tail -30 /tmp/frontend_next.log
        exit 1
    fi
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
echo ""
echo "Para acessar de outra máquina:"
echo "  Use o IP: 192.168.1.X"