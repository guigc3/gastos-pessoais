const appViewState = { view: "gastos" };

const VIEW_SUBTITLES = {
    gastos: "Receitas, despesas e saldo mensal",
    assinaturas: "Assinaturas e custos recorrentes no cartão",
    features: "Histórico de funcionalidades entregues",
};

function setAppView(view) {
    appViewState.view = view;
    const isGastos = view === "gastos";
    const isAssinaturas = view === "assinaturas";
    const isFeatures = view === "features";

    document.querySelectorAll(".app-tab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.view === view);
    });

    document.getElementById("viewGastos")?.classList.toggle("hidden", !isGastos);
    document.getElementById("viewAssinaturas")?.classList.toggle("hidden", !isAssinaturas);
    document.getElementById("viewFeatures")?.classList.toggle("hidden", !isFeatures);

    document.querySelectorAll(".gastos-only").forEach((el) => {
        el.classList.toggle("hidden", !isGastos);
    });
    document.querySelectorAll(".assinaturas-only").forEach((el) => {
        el.classList.toggle("hidden", !isAssinaturas);
    });

    const subtitle = document.getElementById("headerSubtitle");
    if (subtitle) {
        subtitle.textContent = VIEW_SUBTITLES[view] || "";
    }

    if (isAssinaturas && typeof loadAssinaturasView === "function") {
        loadAssinaturasView();
    }
    if (isFeatures && typeof loadFeaturesView === "function") {
        loadFeaturesView();
    }
}

function bindAppTabs() {
    document.querySelectorAll(".app-tab").forEach((btn) => {
        btn.addEventListener("click", () => setAppView(btn.dataset.view));
    });
}

document.addEventListener("DOMContentLoaded", bindAppTabs);
