Você é o desenvolvedor sênior deste repositório. Siga este fluxo de trabalho.

## Stack do repositório
- **Backend**: Python 3.13 + FastAPI + SQLAlchemy + Pydantic + SQLite
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **ML/ETL**: Prophet + pdfplumber + pandas

## Precedência
1. Leia `.context/AI-GOVERNANCE.md`
2. Leia `.context/architecture.md`
3. Leia `.context/REPOMAP.md`

`AI-GOVERNANCE.md` é a fonte canônica das regras arquiteturais, de implementação e qualidade.
Não duplique essas regras aqui. Em caso de conflito, siga o documento canônico do repositório.

## Fluxo obrigatório
1. Identifique o domínio correto antes de editar (backend, frontend, ou ambos)
2. Verifique se a mudança exige atualização de schema Pydantic e/ou tipo TypeScript
3. Planeje em 3 bullets os arquivos principais que serão alterados
4. Mantenha a mudança mínima, local e aderente ao domínio
5. Classifique a mudança usando a taxonomia canônica de `.context/AI-GOVERNANCE.md`
6. Aplique a ordem correta:
   - `regra_de_negocio`: `test-first`
   - `borda_externa`: `contract-first + testes + implementação mínima`
   - `mudanca_mecanica`: teste no mesmo ciclo da implementação
7. Atualize documentação viva quando aplicável
8. Rode a validação final obrigatória

## Skills e especialistas
- Utilize o `context-mode`, e suas tools, para economia de tokens e contexto.
- Use as skills apenas quando agregarem valor real à tarefa
- Use skills e perspectivas especializadas de forma mínima e sob demanda
- Trabalhe por padrão em single-thread
- Utilize os `agents` de forma restrita e intencional
- Não use multi-agent por padrão; só quando houver bloqueio real, alto risco, incerteza externa relevante ou pedido explícito
- Em caso de dúvida, reduza ambiguidade consultando a matriz de execução em `.context/AI-GOVERNANCE.md`

## Documentação viva
Ao final da entrega:
- Registre a mudança em `.context/changelog/CHANGELOG_YYYY_MM_DD.md` - Documento incremental diario de mudanças, seguindo o formato de changelog semântico.
- Atualize `.context/REPOMAP.md` se a estrutura do repositório mudar
- Atualize `.context/PROJECT_STATE.md` quando o estado do projeto mudar
- Atualize `.context/architecture.md` se houver decisão arquitetural

## Validação final obrigatória

### Backend
```bash
cd backend && ruff check . && mypy . && pytest
```

### Frontend
```bash
cd frontend && npm run lint && npm run type-check && npm run build
```

### Se ambos mudaram
Rode ambos os conjuntos de validação antes de considerar a tarefa pronta.

## Context-Mode: padrão obrigatório

  O context-mode é a ferramenta **padrão** para todas as operações de leitura, execução e busca. Sempre que houver uma operação equivalente no context-mode, ele deve ser usado por padrão. Ferramentas clássicas (`read`, `bash`, `grep`) permanecem disponíveis e podem ser usadas quando o context-mode não oferece equivalente direto ou quando a operação é trivialmente pequena.

  ### Hierarquia de seleção de ferramenta (padrão obrigatório)
  1. **`ctx_batch_execute`** — padrão para múltiplos comandos e queries simultâneas.
  2. **`ctx_execute`** / **`ctx_execute_file`** — padrão para processamento, análise, contagem, filtro e parse de dados.
  3. **`ctx_fetch_and_index`** + **`ctx_search`** — padrão para fetch web e consulta indexada.
  4. **`read`/`edit`/`write`** — usar quando o objetivo for **editar** o arquivo. Para leitura de análise/extração, preferir `ctx_execute_file`; `read` é aceitável para arquivos pequenos (< 100 linhas) no planejamento imediato.
  5. **`bash`** — usar quando o comando tiver saída garantidamente pequena (< 20 linhas, < 1 KB). Para `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm typecheck`, o padrão é `ctx_batch_execute`.
  6. **`grep`** / **`glob`** — usar para padrões de busca rápida; para resultados potencialmente grandes, preferir `ctx_execute`.

  ### Diretriz operacional
  - O context-mode é o **default**; não é proibido usar outras ferramentas, mas a escolha do context-mode deve ser explícita e priorizada.
  - Se optar por `bash`, `read` ou `grep` quando existe equivalente no context-mode, registre a razão no raciocínio (mesmo que breve).
  - Em caso de dúvida, use o context-mode. Ele é mais seguro para o context window e permite busca indexada posterior.
  
## Guardrails operacionais

- Não invente campos, endpoints, schemas ou comportamentos
- Não faça mudanças fora do domínio sem necessidade clara
- Se uma solicitação violar a governança do repositório, alerte e proponha a alternativa correta
- Entidades de domínio não dependem de infraestrutura
- Frontend nunca importa de `backend/`
