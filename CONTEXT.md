# Documentação — Controle de Gastos Pessoais

Aplicação Flask + JSON em disco + frontend estático (HTML/CSS/JS), porta **5001**.

## Executar

```bash
py app.py
```

Abra [http://localhost:5001](http://localhost:5001).

## Modelo de dados (`data/gastos.json`)

```json
{
  "secoes_despesa": ["Despesas fixas", "..."],
  "secoes_receita": ["Receitas", "..."],
  "anos": [2026],
  "meses_revisados": [{ "ano": 2026, "mes": 5 }],
  "lancamentos": [ ... ],
  "lixeira": [ ... ]
}
```

## Lançamento

| Campo | Descrição |
|-------|-----------|
| `id` | UUID |
| `ano`, `mes` | Período (mes 1–12) |
| `tipo` | `receita` ou `despesa` |
| `descricao` | Texto livre |
| `valor` | Número positivo |
| `secao` | Agrupamento na UI |
| `tags` | Lista de strings |
| `observacao` | Texto opcional |
| `pago` | Despesa quitada (afeta caixa) |
| `investido` | Receita reservada (não entra no caixa) |
| `historico` | Log de alterações |
| `criado_em` | ISO timestamp |
| `excluido_em` | Preenchido na lixeira |

## Métricas do mês (`calc_totais`)

| Métrica | Fórmula |
|---------|---------|
| `entrada` | Soma de todas as receitas |
| `entrada_investida` | Receitas com `investido=true` |
| `saida` | Soma de todas as despesas |
| `saida_paga` | Despesas com `pago=true` |
| `saida_pendente` | `saida - saida_paga` |
| **caixa** | `entrada - entrada_investida - saida_paga` |
| **liquido** (orçamento) | `entrada - saida` |

## API (referência)

### Metadados e anos
- `GET /api/meta` — nomes dos meses
- `GET /api/anos` — anos disponíveis
- `POST /api/anos` — `{ "ano": 2027 }`
- `DELETE /api/anos/:ano?force=true` — excluir ano

### Seções e tags
- `GET /api/secoes` — `secoes_despesa`, `secoes_receita`
- `POST /api/secoes` — `{ "tipo": "receita|despesa", "nome": "..." }`
- `GET /api/tags` — tags em uso

### Lançamentos
- `GET /api/lancamentos?ano=&mes=`
- `POST /api/lancamentos` — criar
- `PUT /api/lancamentos/:id` — editar (`pago`, `investido`, etc.)
- `DELETE /api/lancamentos/:id` — soft-delete → lixeira
- `DELETE /api/lancamentos/limpar-mes?ano=&mes=`
- `GET /api/lancamentos/:id/historico`

### Resumo e revisão
- `GET /api/resumo?ano=` — visão anual
- `GET /api/resumo?ano=&mes=` — totais + listas por seção
- `GET /api/revisao?ano=`
- `POST /api/revisao/marcar`

### Lixeira
- `GET /api/lixeira`
- `POST /api/lixeira/:id/restaurar`
- `DELETE /api/lixeira/:id` — permanente
- `DELETE /api/lixeira` — esvaziar

### Excel
- `GET /api/template-excel`
- `POST /api/lancamentos/import-excel`

## Frontend (`static/`)

- `app.js`: estado, `loadMes()`, `refreshCaixaFromState()` para cards de caixa
- Modo escuro via `localStorage`
- Chart.js para gráfico anual

## Testes

`tests/test_api.py` — 16 testes: CRUD, caixa, pago, investido, lixeira, limpar mês, revisão, seções, template Excel.
