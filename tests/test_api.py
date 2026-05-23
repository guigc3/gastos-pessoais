"""Testes da API Flask do controle de gastos pessoais."""

import os
import shutil
import tempfile

import pytest

import app as gastos_app


@pytest.fixture
def gastos_client():
    tmp = tempfile.mkdtemp()
    data_dir = os.path.join(tmp, "data")
    os.makedirs(data_dir, exist_ok=True)
    data_file = os.path.join(data_dir, "gastos.json")

    old = {
        "DATA_DIR": gastos_app.DATA_DIR,
        "DATA_FILE": gastos_app.DATA_FILE,
    }
    gastos_app.DATA_DIR = data_dir
    gastos_app.DATA_FILE = data_file

    gastos_app.app.config["TESTING"] = True
    with gastos_app.app.test_client() as client:
        yield client

    for key, value in old.items():
        setattr(gastos_app, key, value)
    shutil.rmtree(tmp, ignore_errors=True)


def _criar_lanc(client, **overrides):
    payload = {
        "ano": 2026,
        "mes": 6,
        "tipo": "despesa",
        "descricao": "Lancamento teste",
        "valor": 500.0,
        "secao": "Geral",
        "observacao": "",
        "tags": [],
    }
    payload.update(overrides)
    return client.post("/api/lancamentos", json=payload)


class TestCalcTotais:
    def test_caixa_com_pago_e_investido(self):
        data = {
            "lancamentos": [
                {"tipo": "receita", "valor": 10000, "ano": 2026, "mes": 6, "investido": True},
                {"tipo": "receita", "valor": 5000, "ano": 2026, "mes": 6, "investido": False},
                {"tipo": "despesa", "valor": 2000, "ano": 2026, "mes": 6, "pago": True},
                {"tipo": "despesa", "valor": 800, "ano": 2026, "mes": 6, "pago": False},
            ]
        }
        t = gastos_app.calc_totais(data, 2026, 6)
        assert t["entrada"] == 15000.0
        assert t["entrada_investida"] == 10000.0
        assert t["saida"] == 2800.0
        assert t["saida_paga"] == 2000.0
        assert t["saida_pendente"] == 800.0
        assert t["caixa"] == 3000.0
        assert t["liquido"] == 12200.0


class TestMetaEAnos:
    def test_meta(self, gastos_client):
        r = gastos_client.get("/api/meta")
        assert r.status_code == 200
        assert len(r.get_json()["meses"]) == 12

    def test_criar_ano(self, gastos_client):
        r = gastos_client.post("/api/anos", json={"ano": 2027})
        assert r.status_code == 201
        assert 2027 in gastos_client.get("/api/anos").get_json()["anos"]


class TestLancamentosCRUD:
    def test_criar_receita_com_historico(self, gastos_client):
        r = _criar_lanc(
            gastos_client,
            tipo="receita",
            descricao="Salario",
            valor=8000,
            secao="Receitas",
        )
        assert r.status_code == 201
        body = r.get_json()
        assert body["tipo"] == "receita"
        assert body.get("historico")
        assert body["historico"][0]["acao"] == "criado"

    def test_criar_despesa(self, gastos_client):
        r = _criar_lanc(gastos_client, descricao="Aluguel", valor=1500)
        assert r.status_code == 201

    def test_listar_e_atualizar(self, gastos_client):
        created = _criar_lanc(gastos_client).get_json()
        lanc_id = created["id"]
        r = gastos_client.get("/api/lancamentos?ano=2026&mes=6")
        assert r.status_code == 200
        assert any(x["id"] == lanc_id for x in r.get_json())

        r2 = gastos_client.put(
            f"/api/lancamentos/{lanc_id}",
            json={"valor": 600, "descricao": "Atualizado"},
        )
        assert r2.status_code == 200
        assert r2.get_json()["valor"] == 600


class TestPagoEInvestido:
    def test_marcar_despesa_paga(self, gastos_client):
        lanc = _criar_lanc(gastos_client, valor=300).get_json()
        r = gastos_client.put(f"/api/lancamentos/{lanc['id']}", json={"pago": True})
        assert r.status_code == 200
        assert r.get_json()["pago"] is True
        hist = gastos_client.get(f"/api/lancamentos/{lanc['id']}/historico").get_json()
        acoes = [h["acao"] for h in hist["historico"]]
        assert "pago" in acoes

    def test_investido_apenas_receita(self, gastos_client):
        rec = _criar_lanc(
            gastos_client, tipo="receita", descricao="Reserva", valor=1000, secao="Receitas"
        ).get_json()
        r = gastos_client.put(f"/api/lancamentos/{rec['id']}", json={"investido": True})
        assert r.status_code == 200
        assert r.get_json()["investido"] is True

        desp = _criar_lanc(gastos_client).get_json()
        r2 = gastos_client.put(f"/api/lancamentos/{desp['id']}", json={"investido": True})
        assert r2.status_code == 400


class TestResumoCaixa:
    def test_resumo_mensal_totais_caixa(self, gastos_client):
        _criar_lanc(
            gastos_client, tipo="receita", descricao="R1", valor=1000, secao="Receitas"
        )
        rec2 = _criar_lanc(
            gastos_client, tipo="receita", descricao="R2", valor=500, secao="Receitas"
        ).get_json()
        gastos_client.put(f"/api/lancamentos/{rec2['id']}", json={"investido": True})
        desp = _criar_lanc(gastos_client, valor=200).get_json()
        gastos_client.put(f"/api/lancamentos/{desp['id']}", json={"pago": True})
        _criar_lanc(gastos_client, valor=100)

        r = gastos_client.get("/api/resumo?ano=2026&mes=6")
        assert r.status_code == 200
        totais = r.get_json()["totais"]
        assert totais["entrada"] == 1500.0
        assert totais["entrada_investida"] == 500.0
        assert totais["saida_paga"] == 200.0
        assert totais["saida_pendente"] == 100.0
        assert totais["caixa"] == 800.0
        assert totais["liquido"] == 1200.0

    def test_resumo_inclui_ultima_alteracao_nos_itens(self, gastos_client):
        lanc = _criar_lanc(gastos_client).get_json()
        gastos_client.put(f"/api/lancamentos/{lanc['id']}", json={"valor": 550})
        r = gastos_client.get("/api/resumo?ano=2026&mes=6")
        despesas = r.get_json()["despesas_por_secao"]
        itens = [i for s in despesas for i in s["itens"]]
        item = next(i for i in itens if i["id"] == lanc["id"])
        assert item.get("ultima_alteracao")


class TestLixeira:
    def test_soft_delete_restaurar(self, gastos_client):
        lanc = _criar_lanc(gastos_client).get_json()
        lanc_id = lanc["id"]
        r_del = gastos_client.delete(f"/api/lancamentos/{lanc_id}")
        assert r_del.status_code == 200

        lista = gastos_client.get("/api/lancamentos?ano=2026&mes=6").get_json()
        assert not any(x["id"] == lanc_id for x in lista)

        lixeira = gastos_client.get("/api/lixeira").get_json()
        assert any(x["id"] == lanc_id for x in lixeira["lixeira"])

        r_rest = gastos_client.post(f"/api/lixeira/{lanc_id}/restaurar")
        assert r_rest.status_code == 200
        lista2 = gastos_client.get("/api/lancamentos?ano=2026&mes=6").get_json()
        assert any(x["id"] == lanc_id for x in lista2)

    def test_limpar_mes(self, gastos_client):
        _criar_lanc(gastos_client, descricao="A")
        _criar_lanc(gastos_client, descricao="B")
        r = gastos_client.delete("/api/lancamentos/limpar-mes?ano=2026&mes=6")
        assert r.status_code == 200
        assert r.get_json()["removidos"] == 2
        assert len(gastos_client.get("/api/lancamentos?ano=2026&mes=6").get_json()) == 0
        assert len(gastos_client.get("/api/lixeira").get_json()["lixeira"]) == 2


class TestRevisaoMeses:
    def test_marcar_mes_revisado(self, gastos_client):
        r = gastos_client.post(
            "/api/revisao/marcar",
            json={"ano": 2026, "mes": 3, "revisado": True},
        )
        assert r.status_code == 200
        assert 3 in r.get_json()["revisados"]

        r2 = gastos_client.get("/api/revisao?ano=2026")
        assert r2.status_code == 200
        assert 3 in r2.get_json()["revisados"]

        r3 = gastos_client.post(
            "/api/revisao/marcar",
            json={"ano": 2026, "mes": 3, "revisado": False},
        )
        assert 3 not in r3.get_json()["revisados"]


class TestSecoesETags:
    def test_criar_secao(self, gastos_client):
        r = gastos_client.post(
            "/api/secoes",
            json={"tipo": "despesa", "nome": "Viagem"},
        )
        assert r.status_code == 201
        secoes = gastos_client.get("/api/secoes").get_json()
        assert "Viagem" in secoes["secoes_despesa"]

    def test_tags_agregadas(self, gastos_client):
        _criar_lanc(gastos_client, tags=["casa", "fixo"])
        tags = gastos_client.get("/api/tags").get_json()["tags"]
        assert "casa" in tags
        assert "fixo" in tags


class TestTemplateExcel:
    def test_download_template(self, gastos_client):
        r = gastos_client.get("/api/template-excel")
        assert r.status_code == 200
        assert (
            r.headers.get("Content-Type", "")
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
