const featuresState = {
    all: [],
    selectedDate: null,
};

function featureDateKey(iso) {
    return String(iso || "").slice(0, 10);
}

function fmtDataFeature(iso) {
    const key = featureDateKey(iso);
    if (!key || key.length < 10) return "—";
    const [y, m, d] = key.split("-");
    return `${d}/${m}/${y}`;
}

function groupFeaturesByDate(features) {
    const map = new Map();
    for (const item of features) {
        const date = featureDateKey(item.implementado_em);
        if (!date) continue;
        if (!map.has(date)) map.set(date, []);
        map.get(date).push(item);
    }
    return map;
}

function getVisibleFeatures() {
    if (!featuresState.selectedDate) return featuresState.all;
    return featuresState.all.filter(
        (f) => featureDateKey(f.implementado_em) === featuresState.selectedDate
    );
}

function updateFeaturesFilterCaption() {
    const caption = document.getElementById("featuresFilterCaption");
    if (!caption) return;

    const total = featuresState.all.length;
    const visible = getVisibleFeatures().length;

    if (!featuresState.selectedDate) {
        caption.textContent = total
            ? `Exibindo todas as ${total} features cadastradas. Clique em uma data na linha do tempo para filtrar.`
            : "";
        return;
    }

    const dataLabel = fmtDataFeature(featuresState.selectedDate);
    caption.textContent = `Exibindo ${visible} feature${visible !== 1 ? "s" : ""} implementada${visible !== 1 ? "s" : ""} em ${dataLabel}.`;
}

function renderFeatureItem(item) {
    const quando = fmtTs(item.implementado_em);
    const desc = item.descricao
        ? `<p class="feature-desc">${escapeHtml(item.descricao)}</p>`
        : "";
    return `
        <li class="feature-item">
            <div class="feature-item-header">
                <h3 class="feature-title">${escapeHtml(item.titulo)}</h3>
                <time class="feature-ts" datetime="${escapeHtml(item.implementado_em || "")}">${escapeHtml(quando)}</time>
            </div>
            ${desc}
        </li>`;
}

function renderFeaturesList(features) {
    const list = document.getElementById("featuresList");
    const totalEl = document.getElementById("featuresTotal");
    if (!list) return;

    if (totalEl) totalEl.textContent = String(features.length);

    if (!features.length) {
        list.innerHTML = `<li class="empty-state" style="padding:32px">Nenhuma feature nesta data.</li>`;
        return;
    }

    list.innerHTML = features.map(renderFeatureItem).join("");
}

function selectFeaturesDate(date) {
    featuresState.selectedDate = featuresState.selectedDate === date ? null : date;
    refreshFeaturesView();
}

function renderFeaturesTimeline() {
    const timeline = document.getElementById("featuresTimeline");
    if (!timeline) return;

    const byDate = groupFeaturesByDate(featuresState.all);
    const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

    if (!dates.length) {
        timeline.innerHTML = `<p class="empty-state" style="padding:16px;margin:0">Nenhuma data registrada.</p>`;
        return;
    }

    const parts = [];
    const allActive = !featuresState.selectedDate;

    parts.push(`
        <button type="button" class="timeline-node timeline-node-all${allActive ? " active" : ""}" data-date="" aria-pressed="${allActive}">
            <span class="timeline-date">Todas</span>
            <span class="timeline-count">${featuresState.all.length}</span>
        </button>
    `);

    dates.forEach((date, index) => {
        const count = byDate.get(date).length;
        const active = featuresState.selectedDate === date;
        if (index > 0 || parts.length) {
            parts.push('<span class="timeline-connector" aria-hidden="true"></span>');
        }
        parts.push(`
            <button type="button" class="timeline-node${active ? " active" : ""}" data-date="${escapeHtml(date)}" aria-pressed="${active}">
                <span class="timeline-date">${escapeHtml(fmtDataFeature(date))}</span>
                <span class="timeline-count">${count} feature${count !== 1 ? "s" : ""}</span>
            </button>
        `);
    });

    timeline.innerHTML = parts.join("");

    timeline.querySelectorAll(".timeline-node").forEach((btn) => {
        btn.addEventListener("click", () => {
            const date = btn.dataset.date || null;
            if (date) {
                selectFeaturesDate(date);
            } else {
                featuresState.selectedDate = null;
                refreshFeaturesView();
            }
        });
    });
}

function refreshFeaturesView() {
    renderFeaturesTimeline();
    renderFeaturesList(getVisibleFeatures());
    updateFeaturesFilterCaption();
}

async function loadFeaturesView() {
    const list = document.getElementById("featuresList");
    const timeline = document.getElementById("featuresTimeline");
    if (list) list.innerHTML = `<li class="empty-state" style="padding:32px">Carregando…</li>`;
    if (timeline) timeline.innerHTML = "";

    try {
        const data = await api("/api/features");
        featuresState.all = data.features || [];
        featuresState.selectedDate = null;
        refreshFeaturesView();
    } catch (err) {
        if (list) {
            list.innerHTML = `<li class="empty-state" style="padding:32px;color:var(--red)">${escapeHtml(err.message)}</li>`;
        }
        toast(err.message, true);
    }
}
