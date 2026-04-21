#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/venv"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_LOG="/tmp/dashboard_backend.log"
FRONTEND_LOG="/tmp/dashboard_frontend.log"

PIDFILE="/tmp/dashboard_dev.pids"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Encerrando aplicações..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    pkill -f "uvicorn backend.api.main:app" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    rm -f "$PIDFILE"
    echo "Aplicações encerradas."
    exit 0
}

stop_apps() {
    echo ""
    echo "Encerrando aplicações..."
    if [ -f "$PIDFILE" ]; then
        source "$PIDFILE"
        [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
        [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    fi
    pkill -f "uvicorn backend.api.main:app" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    rm -f "$PIDFILE"
    echo "Aplicações encerradas."
}

start_apps() {
    stop_apps 2>/dev/null

    # Verifica se pode rodar localmente (venv + node_modules)
    if [ -d "$VENV_DIR" ] && [ -d "$FRONTEND_DIR/node_modules" ]; then
        echo ""
        echo "============================================================"
        echo "  Dashboard Financeiro Municipal - Modo Desenvolvimento"
        echo "============================================================"
        echo ""

        source "$VENV_DIR/bin/activate"
        cd "$PROJECT_DIR"

        echo "[$(date '+%H:%M:%S')] Iniciando Backend (FastAPI)..."
        uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload --log-level info > "$BACKEND_LOG" 2>&1 &
        BACKEND_PID=$!
        echo "  -> PID: $BACKEND_PID | Porta: 8000 | Log: $BACKEND_LOG"

        echo "[$(date '+%H:%M:%S')] Iniciando Frontend (Next.js)..."
        cd "$FRONTEND_DIR"
        npx next dev --port 3000 --hostname 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &
        FRONTEND_PID=$!
        echo "  -> PID: $FRONTEND_PID | Porta: 3000 | Log: $FRONTEND_LOG"

        echo "BACKEND_PID=$BACKEND_PID" > "$PIDFILE"
        echo "FRONTEND_PID=$FRONTEND_PID" >> "$PIDFILE"

        trap cleanup SIGINT SIGTERM

        sleep 2

        echo ""
        echo "============================================================"
        echo "  Backend:  http://localhost:8000"
        echo "  Docs:     http://localhost:8000/docs"
        echo "  Frontend: http://localhost:3000"
        echo "============================================================"
        echo ""
        echo "  Ctrl+C para encerrar"
        echo ""

        tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
    else
        # Fallback: usa Docker Compose
        if ! command -v docker &>/dev/null; then
            echo "Erro: nem venv local nem Docker encontrados."
            echo ""
            echo "Para rodar localmente:"
            echo "  sudo apt install python3.12-venv"
            echo "  python3 -m venv $VENV_DIR"
            echo "  source $VENV_DIR/bin/activate"
            echo "  pip install -r $PROJECT_DIR/backend/requirements.txt"
            echo "  cd $FRONTEND_DIR && npm install"
            return
        fi

        echo ""
        echo "============================================================"
        echo "  Dashboard Financeiro Municipal - Docker Compose Dev"
        echo "============================================================"
        echo ""

        if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
            echo "Instalando dependências do frontend..."
            cd "$FRONTEND_DIR" && npm install && cd "$PROJECT_DIR"
        fi

        echo "[$(date '+%H:%M:%S')] Iniciando containers..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    fi

    echo "BACKEND_PID=$BACKEND_PID" > "$PIDFILE"
    echo "FRONTEND_PID=$FRONTEND_PID" >> "$PIDFILE"

    trap cleanup SIGINT SIGTERM

    sleep 2

    echo ""
    echo "============================================================"
    echo "  Backend:  http://localhost:8000"
    echo "  Docs:     http://localhost:8000/docs"
    echo "  Frontend: http://localhost:3000"
    echo "============================================================"
    echo ""
    echo "  Ctrl+C para encerrar"
    echo ""

    tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
}

show_logs() {
    echo ""
    echo "  [b] Backend | [f] Frontend | [a] Ambos (default) | [v] Voltar"
    read -rp "  Ver logs de: " LOG Choice

    case "$LOG_CHOICE" in
        b) tail -f "$BACKEND_LOG" ;;
        f) tail -f "$FRONTEND_LOG" ;;
        a) tail -f "$BACKEND_LOG" "$FRONTEND_LOG" ;;
        *) return ;;
    esac
}

show_status() {
    echo ""
    echo "------------------------------------------------------------"
    if [ -f "$PIDFILE" ]; then
        source "$PIDFILE"
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo "  Backend:  RODANDO (PID $BACKEND_PID)"
        else
            echo "  Backend:  PARADO"
        fi
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo "  Frontend: RODANDO (PID $FRONTEND_PID)"
        else
            echo "  Frontend: PARADO"
        fi
    else
        echo "  Backend:  PARADO"
        echo "  Frontend: PARADO"
    fi
    echo "------------------------------------------------------------"
}

menu() {
    while true; do
        echo ""
        echo "============================================================"
        echo "  Dashboard Financeiro Municipal"
        echo "============================================================"
        show_status
        echo ""
        echo "  [1] Iniciar modo DEV"
        echo "  [2] Encerrar aplicações"
        echo "  [3] Ver logs"
        echo "  [0] Sair"
        echo "============================================================"
        read -rp "  Opção: " OPTION

        case "$OPTION" in
            1) start_apps ;;
            2) stop_apps ;;
            3) show_logs ;;
            0) echo "Saindo..."; exit 0 ;;
            *) echo "Opção inválida." ;;
        esac
    done
}

if [ "$1" = "start" ]; then
    start_apps
elif [ "$1" = "stop" ]; then
    stop_apps
elif [ "$1" = "logs" ]; then
    show_logs
else
    menu
fi
