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
data/gastos.json        # Persistência JSON (lançamentos mensais)
data/assinaturas.json   # Assinaturas / recorrentes no cartão
data/features.json      # Changelog de features (aba Features)
static/             # Frontend (HTML, CSS, JS)
tests/test_api.py   # 16 testes da API
```

## Documentação

- **[FEATURES.md](FEATURES.md)** — todas as funcionalidades implementadas
- **[CONTEXT.md](CONTEXT.md)** — modelo de dados, API, métricas de caixa e fluxos

## Funcionalidades (resumo)

- **Aba Assinaturas** — controle de assinaturas e custos recorrentes no cartão (independente dos lançamentos mensais)
- **Aba Features** — lista de funcionalidades implementadas com data e hora

## Registrar nova feature

Ao concluir uma entrega, adicione um item em `data/features.json`:

```json
{
  "id": "f014-identificador-unico",
  "titulo": "Nome curto da feature",
  "descricao": "Opcional — o que foi entregue.",
  "implementado_em": "2026-05-23T18:45:00"
}
```

Use data e hora reais no formato ISO (`AAAA-MM-DDTHH:MM:SS`).
- CRUD de receitas/despesas, seções, tags, gráfico anual, modo escuro
- Despesas **pagas** e receitas **investidas** (afetam caixa disponível)
- Lixeira, limpar mês, meses revisados, histórico por lançamento
- Import/export Excel

## Importar da planilha Excel

```bash
py import_excel.py
```

Variáveis opcionais: `PLANILHA_GASTOS`, `PLANILHA_ANO`.
