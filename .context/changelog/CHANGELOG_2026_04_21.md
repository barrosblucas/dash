# Changelog — 2026-04-21

## Governance — Endurecimento dos gates de arquivo

### Corrigido
- **AI-GOVERNANCE**: tabela "Hard limits" unificada — limite de 400 linhas para todos os tipos de arquivo (`.py`, `.ts`, `.tsx`, `.js`, `.jsx`). Exceção `constants.ts` até 500.
- **AI-GOVERNANCE**: exception metadata agora explicitamente documentada como NÃO isenta do gate — é apenas rastreamento de débito técnico.
- **AI-GOVERNANCE**: `--strict` agora é o padrão documentado; `--warn-only` para diagnóstico apenas.

### Endurecido
- **`scripts/check_file_length.py`**: remoção completa do mecanismo `--baseline` (bypass de arquivos conhecidos). Exception metadata agora gera relatório separado mas ainda conta como violação (bloqueia). Novo formato de relatório com estatísticas e maior excesso.
- **`scripts/run_governance_gates.py`**: `--strict` é o padrão (exit 1 em falha). Flag `--warn-only` adicionada para diagnóstico manual. `--strict` removida (agora é o comportamento default).
- **`.pre-commit-config.yaml`**: criado com os 3 gates estruturais (file length, frontend boundaries, no console/print). Hook pre-commit instalado no git — gates rodam automaticamente em cada commit.

### Diagnosticado
- Varredura completa identificou **15 arquivos** acima do limite de linhas (era 6 no PROJECT_STATE anterior).
- Backend: 5 arquivos `.py` acima de 400 linhas (incluindo `pdf_extractor.py` com 851 linhas).
- Frontend: 10 arquivos `.ts/.tsx` acima de 300 linhas (incluindo `avisos-licitacoes-client.tsx` com 1318 linhas).
- Nenhum hook de pre-commit, CI ou Makefile existia — gates eram puramente manuais.

## backend/api/routes/licitacoes.py

### Corrigido
- **ComprasBR**: adicionado header `Referer: https://comprasbr.com.br/` na requisição `client.get` para atender exigência da API externa.
- **ComprasBR**: ajustada extração do corpo da resposta para `data.get("items", data.get("content", []))`, garantindo compatibilidade com a chave `items` retornada pelo ComprasBR.
- **Quality parser**: refatorada função `_parse_dispensas_from_html` para iterar todos os `<tr>` do primeiro `<tbody>`, detectar blocos de licitação pela presença de 10 `<td>`s e buscar o texto do objeto em linhas subsequentes com 1 `<td>` iniciado por "Objeto".
- **Quality parser**: extração da `modalidade` da célula 2 do header (ex: "Pregão Eletrônico", "Dispensa").
- **Quality parser**: construção de `urlProcesso` para cada item no formato `https://avisolicitacao.qualitysistemas.com.br/prefeitura_municipal_de_bandeirantes/{codigo}`.
- **ComprasBR**: `urlProcesso` agora aponta para a página de detalhes correta: `https://comprasbr.com.br/pregao-eletronico-detalhe/?idlicitacao={id}`.
- **Novo endpoint**: `GET /api/v1/licitacoes/comprasbr/{id}` retorna detalhes completos de uma licitação ComprasBR (datas de propostas, pregoeiro, legislação, documentos, etc.).

## backend/api/schemas.py

### Adicionado
- `LicitacaoComprasBRItem`: campo `urlProcesso: str = ""`.
- `DispensaLicitaçãoItem`: campos `urlProcesso: str = ""` e `modalidade: str = ""`.

## backend/tests/test_api/test_licitacoes.py

### Adicionado
- Testes unitários para `_parse_dispensas_from_html` cobrindo:
  - HTML vazio (retorna lista vazia)
  - HTML sem `<tbody>` (retorna lista vazia)
  - Uma licitação completa (extração de todos os campos incluindo modalidade, objeto e urlProcesso)
  - Múltiplas licitações (verificação de quantidade e campos específicos)
  - Objeto não encontrado (campo objeto vazio)

## frontend/types/licitacao.ts

### Adicionado
- `urlProcesso?: string` em `LicitacaoUnified`.
- Campos opcionais `disputa`, `criterio`, `tipo` em `LicitacaoUnified`.

## frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx

### Adicionado
- Função `extrairTituloSucinto(objeto: string): string` para resumir objetos longos de licitações (remove prefixos/sufixos comuns, extrai frases em maiúsculas).
- Função `getFeriados(ano: number): Map<string, string>` com feriados nacionais, estaduais (MS) e móveis (Páscoa, Sexta-feira Santa, Corpus Christi) via algoritmo de Meeus/Jones/Butcher.
- Exibição de feriados no calendário mensal e semanal (badge vermelho com nome do feriado).
- Integração com endpoint de detalhes ComprasBR: modal busca informações extras (pregoeiro, legislação, datas de propostas, disputa, documentos) ao abrir.
- Download direto de edital ComprasBR via `arquivoUri` (quando disponível).

### Corrigido
- Parsers `parseComprasBR` e `parseDispensas` agora propagam `urlProcesso`, `modalidade`, `disputa`, `criterio` e `tipo`.
- Visualização semanal: tags de itens agora exibem título sucinto em vez de apenas o número do edital.
- Lista de itens do dia selecionado e cards mobile/lista agora exibem título sucinto.
- **Modal de detalhes**:
  - Botão "Ver no portal" renomeado para "Ver processo na íntegra" e aponta para `urlProcesso`.
  - Botão "Download Edital" agora abre link direto do PDF quando `arquivoUri` está disponível (ComprasBR).
  - Exibe campos extras da Quality (`disputa`, `criterio`, `tipo`) quando disponíveis.
  - Refatorada a renderização condicional do órgão para usar `item.orgaoNome` diretamente.
  - Exibe seção "Informações do Processo" com pregoeiro, legislação, fase, disputa e modo de disputa (ComprasBR).
  - Exibe seção "Datas de Envio de Propostas" com início e fim (ComprasBR).
  - Exibe lista de documentos anexados com links diretos de download (ComprasBR).
