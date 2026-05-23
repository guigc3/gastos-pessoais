# Funcionalidades — Controle de Gastos Pessoais

Documento de referência com **todas as funcionalidades implementadas** no projeto. A aba **Features** do app (`http://localhost:5001`) exibe um resumo cronológico a partir de `data/features.json`.

---

## Visão geral

| Item | Detalhe |
|------|---------|
| **Stack** | Flask (API) + HTML/CSS/JS + Chart.js |
| **Porta** | 5001 (`py app.py`) |
| **Persistência** | JSON em disco com leitura/gravação segura (lock de arquivo) |
| **Arquivos de dados** | `data/gastos.json`, `data/assinaturas.json`, `data/features.json` |
| **Testes** | `py -m pytest tests -v` (21 testes) |

O app possui **três abas principais**: Gastos mensais, Assinaturas e Features.

---

## Aba Gastos mensais

### Lançamentos (receitas e despesas)

- **CRUD completo** por ano e mês: criar, editar e excluir lançamentos.
- **Tipos:** `receita` e `despesa`.
- **Campos:** descrição (texto livre), valor, seção, tags, observação.
- **Agrupamento por seções** na interface (receitas e despesas em painéis separados).
- **Botão “Adicionar”** por tipo e por seção para novo lançamento na seção correta.
- **Modal de formulário** para criar/editar com validação no backend.

### Seções e tags

- **Seções dinâmicas** para receitas e despesas (`secoes_receita`, `secoes_despesa`).
- **Criar nova seção** direto no modal do lançamento (sem sair do formulário).
- **Tags** com chips no modal, sugestões via datalist e normalização (sem duplicatas, case-insensitive).
- **Listagem de tags** em uso (`GET /api/tags`).

### Despesas pagas e receitas investidas

- **Checkbox “pago”** em despesas: marca quitada, altera visual (linha + emoji) e **reduz o caixa disponível**.
- **Checkbox “investido”** em receitas: reserva imediata; valor **não entra no caixa** (apenas em receitas; API rejeita em despesas).
- **Atualização imediata** dos cards de resumo ao marcar/desmarcar (`refreshCaixaFromState`), sem recarregar a página inteira.
- **Badges por seção:** total pago nas despesas e total investido nas receitas.
- **Badge consolidado** no cabeçalho de Despesas (total pago) e Receitas (total investido).

### Cards de resumo do mês

| Card | Significado |
|------|-------------|
| **Entrada** | Soma de todas as receitas do mês |
| **Saída total** | Soma de todas as despesas lançadas |
| **Caixa disponível** | Entrada − receitas investidas − despesas pagas |
| **A pagar** | Despesas ainda não marcadas como pagas |
| **Orçamento** | Entrada − saída total (compromisso do mês) |

### Navegação temporal

- **Abas de meses** (Jan–Dez) com seleção do mês ativo.
- **Seletor de ano** com criar e excluir ano.
- **Criar ano** via modal (validação 1900–2200).
- **Excluir ano** com modal de confirmação e impacto (quantidade de lançamentos); suporte a `force=true` na API.

### Meses revisados

- **Checkbox “revisado”** em cada aba de mês para controle de conferência.
- Estado visual na barra de meses (mês marcado como revisado).
- Persistência em `meses_revisados` no JSON.

### Histórico de alterações (lançamentos)

- **Log por lançamento** com ações: `criado`, `editado`, `pago`, `despago`, `investido`, `desinvestido`, `excluido`, `restaurado`.
- **Modal de histórico** (ícone 📋) com entradas do mais recente ao mais antigo.
- **Última alteração** exibida em cada linha da tabela (data/hora formatada em pt-BR).

### Lixeira

- **Exclusão reversível** (soft-delete): lançamento vai para `lixeira` com `excluido_em`.
- **Modal da lixeira** com lista de excluídos.
- **Restaurar** lançamento para o mês original.
- **Excluir permanentemente** um item da lixeira.
- **Esvaziar lixeira** (remove todos de uma vez).

### Limpar mês

- **Botão “Limpar mês”**: move **todos** os lançamentos do ano/mês atual para a lixeira em lote (`DELETE /api/lancamentos/limpar-mes`).

### Gráfico e visão anual

- **Gráfico anual** (Chart.js): entrada, saída e saldo líquido por mês.
- **Destaques** acima do gráfico: melhor mês, pior mês e saída média (com base no líquido/saída).
- **Subtítulo** com totais do ano selecionado.
- **Modo escuro** aplicado também ao gráfico (cores de legenda e eixos).

### Excel

- **Download do modelo** `.xlsx` (`GET /api/template-excel`) com colunas e linhas de exemplo.
- **Importação pela interface** (upload `.xlsx`/`.xlsm`) com relatório de criados e erros por linha.
- **Script CLI** `import_excel.py` para importação inicial a partir de planilha legada (`Planilha gastos.xlsx`); variáveis `PLANILHA_GASTOS` e `PLANILHA_ANO`.

### Interface e UX (Gastos)

- **Modo escuro / claro** com botão no header e preferência em `localStorage` (respeita `prefers-color-scheme` na primeira visita).
- **Toasts** de feedback para sucesso e erro.
- **Modais centralizados** para formulários e confirmações.
- **Ícones padronizados** nas ações: histórico 📋, editar ✏️, excluir 🗑.
- Layout responsivo com cards e tabelas por seção.

---

## Aba Assinaturas

Módulo **independente** dos lançamentos mensais: custos recorrentes no cartão de crédito (`data/assinaturas.json`).

### Cadastro e listagem

- **CRUD de assinaturas:** descrição, data de início, data de fim (opcional), valor mensal, cartão de crédito.
- **Tabela** com todas as assinaturas ordenadas por cartão e descrição.
- **Status ativa/inativa** calculado pela data fim (linha visual diferenciada se encerrada).
- **Cartões** cadastrados automaticamente ao salvar; datalist no formulário.
- **Filtro por cartão** no painel de assinaturas.

### Resumo (cards)

- **Total mensal (ativas):** soma dos valores das assinaturas ainda ativas.
- **Quantidade** total cadastrada.
- **Quantidade ativas** no momento.

### Histórico e ações

- **Histórico de alterações** por assinatura (criado, editado), modal igual ao de lançamentos.
- **Última alteração** retornada pela API (`ultima_alteracao`).
- **Exclusão definitiva** (sem lixeira).
- **Validação de datas:** `data_fim` não pode ser anterior a `data_inicio`.
- **Filtro API** `?ativas=1` para listar só assinaturas ativas.

### Interface

- Mesmos **ícones de ação** (histórico, editar, excluir) que na aba Gastos.
- Header e botões contextuais trocam conforme a aba ativa (`tabs.js`).

---

## Aba Features

- **Lista cronológica** das funcionalidades entregues (mais recentes primeiro).
- Dados em `data/features.json` (id, título, descrição, `implementado_em`).
- **API** `GET /api/features` com total de itens.
- **Instrução na UI** para registrar novas entregas no JSON ao implementar algo novo.

---

## Backend e infraestrutura

### API REST (Flask)

Resumo dos grupos de rotas:

| Grupo | Rotas principais |
|-------|------------------|
| Metadados | `GET /api/meta` |
| Anos | `GET/POST /api/anos`, `DELETE /api/anos/:ano` |
| Seções / tags | `GET/POST /api/secoes`, `GET /api/tags` |
| Lançamentos | `GET/POST /api/lancamentos`, `PUT/DELETE .../:id`, `DELETE .../limpar-mes` |
| Histórico | `GET /api/lancamentos/:id/historico` |
| Resumo | `GET /api/resumo?ano=&mes=` (mensal ou anual) |
| Revisão | `GET /api/revisao`, `POST /api/revisao/marcar` |
| Lixeira | `GET /api/lixeira`, `POST .../restaurar`, `DELETE` item ou esvaziar |
| Excel | `GET /api/template-excel`, `POST /api/lancamentos/import-excel` |
| Assinaturas | `GET/POST /api/assinaturas`, `PUT/DELETE .../:id`, `GET .../historico`, `GET /api/assinaturas/cartoes` |
| Features | `GET /api/features` |

### Persistência e concorrência

- **Leitura/gravação JSON** com arquivo `.lock` e retentativas (`safe_read_json` / `safe_write_json`).
- **CORS** habilitado para desenvolvimento local.
- **Filtro por tag** suportado na API de resumo e lançamentos (`?tag=`).

### Métricas (`calc_totais`)

Campos calculados: `entrada`, `entrada_investida`, `saida`, `saida_paga`, `saida_pendente`, `caixa`, `liquido`.

### Testes automatizados (`tests/test_api.py`)

| Área | Cobertura |
|------|-----------|
| Totais de caixa | Pago + investido |
| Anos e meta | Criar ano, meses |
| Lançamentos | CRUD, histórico |
| Pago / investido | Regras por tipo |
| Resumo | Caixa e última alteração |
| Lixeira | Soft-delete, limpar mês, restaurar |
| Revisão | Marcar/desmarcar mês |
| Seções e tags | Criar seção, agregar tags |
| Excel | Download do template |
| Assinaturas | CRUD, histórico, filtros, validação de datas |
| Features | Ordenação da lista |

---

## Cronologia registrada (`data/features.json`)

Todas as funcionalidades documentadas neste arquivo estão cadastradas em `data/features.json` (24 itens, `implementado_em`: `2026-05-23T00:00:00`).

| ID | Feature |
|----|---------|
| f001 | CRUD de receitas e despesas mensais |
| f002 | Caixa disponível e orçamento |
| f003 | Despesas pagas e receitas investidas |
| f004 | Gráfico de visão anual |
| f005 | Modo escuro |
| f006 | Histórico de alterações por lançamento |
| f007 | Lixeira de lançamentos |
| f008 | Meses revisados |
| f009 | Importação e modelo Excel |
| f010 | Aba Assinaturas |
| f011 | Ícones padronizados nas ações |
| f012 | Modais centralizados |
| f013 | Aba Features implementadas |
| f014 | Limpar mês |
| f015 | Última alteração na linha |
| f016 | Badges de total pago e investido |
| f017 | Atualização ao vivo do caixa |
| f018 | Destaques do gráfico anual |
| f019 | Gestão de anos |
| f020 | Script import_excel.py |
| f021 | Repositório gastos-pessoais |
| f022 | Seções dinâmicas e tags |
| f023 | Navegação entre abas do app |
| f024 | Toasts de feedback |

---

## Como registrar uma nova feature

1. Implemente a funcionalidade no código.
2. Adicione um objeto em `data/features.json`:

```json
{
  "id": "f014-identificador-unico",
  "titulo": "Nome curto da feature",
  "descricao": "O que foi entregue.",
  "implementado_em": "2026-05-23T18:45:00"
}
```

3. Use data e hora reais em ISO (`AAAA-MM-DDTHH:MM:SS`).
4. Atualize este arquivo (`FEATURES.md`) se a mudança for relevante para a documentação geral.

---

## Documentação relacionada

- [README.md](README.md) — instalação e execução
- [CONTEXT.md](CONTEXT.md) — modelo de dados e referência da API
