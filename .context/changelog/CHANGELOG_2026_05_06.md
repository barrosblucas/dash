# CHANGELOG — 2026-05-06

## frontend
### Corrigido
- `SaudeFeatureNav` ausente em `/saude/procedimentos` e `/saude/unidades`; barra de navegação agora presente em todas as páginas da saúde
- `HospitalHeatmapPanel`: escala de cores do mapa de calor refeita com multi-stop (amarelo claro → laranja → vermelho intenso) em substituição à opacidade única sobre laranja, que tornava baixas concentrações quase invisíveis; texto alterna para branco em células escuras (>50% intensidade)
- Espaçamento dos gráficos de barras horizontais (CID, procedimentos, visitas, vacinação, atenção primária) refeito com altura dinâmica proporcional ao número de itens (`minItemGap` 48px, mínimo 420px em `RankingOrUnavailable`), YAxis alargado (120→150px) e fonte reduzida (12→11px) com `tickMargin={8}` para reduzir quebra de linha e evitar sobreposição de labels ICD multi-linha
