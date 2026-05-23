# Controle de Gastos Pessoais

Sistema web para controle mensal de receitas e despesas, com visão de orçamento, caixa disponível, histórico de alterações e lixeira.

| App | Como rodar | URL |
|-----|------------|-----|
| **Gastos** | `py app.py` | http://localhost:5001 |

## Instalação

```bash
pip install -r requirements.txt
```

## Executar

```bash
py app.py
```

## Testes

```bash
py -m pytest tests -v
```

## Estrutura

```
app.py              # API Flask (porta 5001)
import_excel.py     # Importação a partir de planilha Excel
data/gastos.json    # Persistência JSON (dados locais)
static/             # Frontend (HTML, CSS, JS)
tests/test_api.py   # 16 testes da API
```

## Documentação

- **[CONTEXT.md](CONTEXT.md)** — modelo de dados, API, métricas de caixa e fluxos

## Funcionalidades (resumo)

- CRUD de receitas/despesas, seções, tags, gráfico anual, modo escuro
- Despesas **pagas** e receitas **investidas** (afetam caixa disponível)
- Lixeira, limpar mês, meses revisados, histórico por lançamento
- Import/export Excel

## Importar da planilha Excel

```bash
py import_excel.py
```

Variáveis opcionais: `PLANILHA_GASTOS`, `PLANILHA_ANO`.
