const assinaturasState = {
    cartoes: [],
    filtroCartao: "",
    lista: [],
};

const ASSINATURA_CAMPO_LABELS = {
    descricao: "Descrição",
    data_inicio: "Data início",
    data_fim: "Data fim",
    valor_mensal: "Valor mensal",
    cartao: "Cartão",
};

function fmtDataBr(iso) {
    if (!iso) return "—";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
}

function fmtHistoricoAssinatura(campo, val) {
    if (val === null || val === undefined || val === "") return "—";
    if (campo === "valor_mensal") return fmt.format(Number(val));
    if (campo === "data_inicio" || campo === "data_fim") return fmtDataBr(val);
    return escapeHtml(String(val));
}

function renderAssinaturaHistoricoEntry(entry) {
    const info = (typeof ACAO_LABELS !== "undefined" && ACAO_LABELS[entry.acao]) || { icon: "•", label: entry.acao };
    const antes = entry.antes || {};
    const depois = entry.depois || {};
    const campos = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    const linhas = [...campos].map((campo) => {
        const lbl = ASSINATURA_CAMPO_LABELS[campo] || campo;
        const a = fmtHistoricoAssinatura(campo, antes[campo]);
        const d = fmtHistoricoAssinatura(campo, depois[campo]);
        if (entry.acao === "criado") {
            return `<div class="hist-campo"><span class="hist-campo-nome">${escapeHtml(lbl)}</span><span class="hist-valor-depois">${d}</span></div>`;
        }
        return `<div class="hist-campo"><span class="hist-campo-nome">${escapeHtml(lbl)}</span><span class="hist-valor-antes">${a}</span><span class="hist-arrow">→</span><span class="hist-valor-depois">${d}</span></div>`;
    }).join("");

    return `
        <div class="hist-entry">
            <div class="hist-entry-header">
                <span class="hist-acao-icon">${info.icon}</span>
                <span class="hist-acao-label">${escapeHtml(info.label)}</span>
                <span class="hist-ts">${fmtTs(entry.ts)}</span>
            </div>
            ${linhas ? `<div class="hist-campos">${linhas}</div>` : ""}
        </div>`;
}

function renderCartoesDatalist() {
    const dl = document.getElementById("cartoesAssinaturaList");
    if (!dl) return;
    dl.innerHTML = assinaturasState.cartoes
        .map((c) => `<option value="${escapeHtml(c)}">`)
        .join("");
}

function renderFiltroCartoes() {
    const sel = document.getElementById("filtroCartaoAssinaturas");
    if (!sel) return;
    const atual = assinaturasState.filtroCartao;
    sel.innerHTML = '<option value="">Todos</option>';
    assinaturasState.cartoes.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === atual) opt.selected = true;
        sel.appendChild(opt);
    });
}

function fmtAssinaturaRow(item) {
    const status = item.ativa
        ? '<span class="badge-ativa">Ativa</span>'
        : '<span class="badge-encerrada">Encerrada</span>';
    const rowClass = item.ativa ? "" : " assinaturas-row-inativa";
    const ultima = fmtTs(item.ultima_alteracao);
    return `
        <tr class="assinatura-row${rowClass}" data-id="${item.id}">
            <td><strong>${escapeHtml(item.descricao)}</strong><br>${status}</td>
            <td>${escapeHtml(item.cartao || "—")}</td>
            <td class="col-valor">${fmt.format(item.valor_mensal)}</td>
            <td><small>${fmtDataBr(item.data_inicio)}</small></td>
            <td><small>${fmtDataBr(item.data_fim)}</small></td>
            <td><small class="text-muted">${escapeHtml(ultima)}</small></td>
            <td class="col-acoes">
                <button type="button" class="btn btn-ghost btn-sm btn-assin-hist" data-id="${item.id}" title="Histórico">📋</button>
                <button type="button" class="btn btn-ghost btn-sm btn-assin-edit" data-id="${item.id}" title="Editar">✏️</button>
                <button type="button" class="btn btn-danger btn-sm btn-assin-del" data-id="${item.id}" title="Excluir">🗑</button>
            </td>
        </tr>`;
}

function bindAssinaturasTableEvents() {
    const wrap = document.getElementById("assinaturasTableWrap");
    if (!wrap) return;

    wrap.querySelectorAll(".btn-assin-hist").forEach((btn) => {
        btn.addEventListener("click", () => openAssinaturaHistorico(btn.dataset.id));
    });
    wrap.querySelectorAll(".btn-assin-edit").forEach((btn) => {
        btn.addEventListener("click", () => openAssinaturaModal(btn.dataset.id));
    });
    wrap.querySelectorAll(".btn-assin-del").forEach((btn) => {
        btn.addEventListener("click", () => deleteAssinatura(btn.dataset.id));
    });
}

function renderAssinaturasTable() {
    const wrap = document.getElementById("assinaturasTableWrap");
    const lista = assinaturasState.lista;

    document.getElementById("assinaturasTotalQtd").textContent = String(lista.length);
    document.getElementById("assinaturasTotalAtivas").textContent = String(
        lista.filter((a) => a.ativa).length
    );

    if (!lista.length) {
        wrap.innerHTML = `<div class="empty-state" style="padding:40px">Nenhuma assinatura cadastrada. Clique em <strong>+ Nova assinatura</strong>.</div>`;
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Cartão</th>
                    <th class="col-valor">Valor/mês</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Última alteração</th>
                    <th class="col-acoes">Ações</th>
                </tr>
            </thead>
            <tbody>${lista.map(fmtAssinaturaRow).join("")}</tbody>
        </table>`;
    bindAssinaturasTableEvents();
}

async function loadCartoesAssinaturas() {
    const data = await api("/api/assinaturas/cartoes");
    assinaturasState.cartoes = data.cartoes || [];
    renderCartoesDatalist();
    renderFiltroCartoes();
}

async function loadAssinaturasList() {
    const params = new URLSearchParams();
    if (assinaturasState.filtroCartao) {
        params.set("cartao", assinaturasState.filtroCartao);
    }
    const qs = params.toString();
    const data = await api(`/api/assinaturas${qs ? `?${qs}` : ""}`);
    assinaturasState.lista = data.assinaturas || [];
    document.getElementById("assinaturasTotalMensal").textContent = fmt.format(
        data.total_mensal_ativas || 0
    );
    renderAssinaturasTable();
}

async function loadAssinaturasView() {
    const wrap = document.getElementById("assinaturasTableWrap");
    if (wrap) wrap.innerHTML = `<div class="empty-state" style="padding:40px">Carregando…</div>`;
    try {
        await loadCartoesAssinaturas();
        await loadAssinaturasList();
    } catch (err) {
        if (wrap) {
            wrap.innerHTML = `<div class="empty-state" style="padding:40px;color:var(--red)">${escapeHtml(err.message)}</div>`;
        }
        toast(err.message, true);
    }
}

function openAssinaturaModal(id = null) {
    const dlg = document.getElementById("modalAssinatura");
    const title = document.getElementById("modalAssinaturaTitle");
    document.getElementById("assinaturaId").value = id || "";
    document.getElementById("formAssinatura").reset();
    document.getElementById("assinaturaId").value = id || "";

    if (id) {
        const item = assinaturasState.lista.find((a) => a.id === id);
        if (!item) {
            toast("Assinatura não encontrada", true);
            return;
        }
        title.textContent = "Editar assinatura";
        document.getElementById("assinaturaDescricao").value = item.descricao || "";
        document.getElementById("assinaturaDataInicio").value = (item.data_inicio || "").slice(0, 10);
        document.getElementById("assinaturaDataFim").value = item.data_fim ? String(item.data_fim).slice(0, 10) : "";
        document.getElementById("assinaturaValorMensal").value = item.valor_mensal;
        document.getElementById("assinaturaCartao").value = item.cartao || "";
    } else {
        title.textContent = "Nova assinatura";
        const hoje = new Date().toISOString().slice(0, 10);
        document.getElementById("assinaturaDataInicio").value = hoje;
    }

    dlg.showModal();
}

async function saveAssinatura(e) {
    e.preventDefault();
    const id = document.getElementById("assinaturaId").value.trim();
    const payload = {
        descricao: document.getElementById("assinaturaDescricao").value.trim(),
        data_inicio: document.getElementById("assinaturaDataInicio").value,
        data_fim: document.getElementById("assinaturaDataFim").value || null,
        valor_mensal: parseFloat(document.getElementById("assinaturaValorMensal").value),
        cartao: document.getElementById("assinaturaCartao").value.trim(),
    };

    try {
        if (id) {
            await api(`/api/assinaturas/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            toast("Assinatura atualizada");
        } else {
            await api("/api/assinaturas", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            toast("Assinatura cadastrada");
        }
        document.getElementById("modalAssinatura").close();
        await loadAssinaturasView();
    } catch (err) {
        toast(err.message, true);
    }
}

async function deleteAssinatura(id) {
    const item = assinaturasState.lista.find((a) => a.id === id);
    const nome = item?.descricao || "esta assinatura";
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
        await api(`/api/assinaturas/${id}`, { method: "DELETE" });
        toast("Assinatura excluída");
        await loadAssinaturasView();
    } catch (err) {
        toast(err.message, true);
    }
}

async function openAssinaturaHistorico(id) {
    const dlg = document.getElementById("modalHistorico");
    const body = document.getElementById("historicoBody");
    const subtitle = document.getElementById("historicoSubtitle");
    body.innerHTML = `<div class="empty-state" style="padding:32px">Carregando…</div>`;
    subtitle.textContent = "";
    dlg.showModal();
    try {
        const data = await api(`/api/assinaturas/${id}/historico`);
        subtitle.textContent = data.descricao || "";
        if (!data.historico || !data.historico.length) {
            body.innerHTML = `<div class="empty-state" style="padding:32px">Nenhuma alteração registrada.</div>`;
            return;
        }
        body.innerHTML = `<div class="hist-list">${data.historico.map(renderAssinaturaHistoricoEntry).join("")}</div>`;
    } catch (err) {
        body.innerHTML = `<div class="empty-state" style="padding:32px;color:var(--red)">${escapeHtml(err.message)}</div>`;
    }
}

function bindAssinaturasEvents() {
    document.getElementById("btnNovaAssinatura")?.addEventListener("click", () => openAssinaturaModal());
    document.getElementById("formAssinatura")?.addEventListener("submit", saveAssinatura);
    document.getElementById("btnCancelarAssinatura")?.addEventListener("click", () => {
        document.getElementById("modalAssinatura").close();
    });
    document.getElementById("btnFecharModalAssinatura")?.addEventListener("click", () => {
        document.getElementById("modalAssinatura").close();
    });
    document.getElementById("modalAssinatura")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
    });

    document.getElementById("filtroCartaoAssinaturas")?.addEventListener("change", (e) => {
        assinaturasState.filtroCartao = e.target.value;
        loadAssinaturasList().catch((err) => toast(err.message, true));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    bindAssinaturasEvents();
});
