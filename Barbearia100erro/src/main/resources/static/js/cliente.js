import { api, escapeHtml, formatDate, money, notify } from "./api.js";

const authPanel = document.querySelector("#auth-panel");
const profilePanel = document.querySelector("#profile-panel");
let authMode = "login";
let currentUser = JSON.parse(sessionStorage.getItem("barbearia-cliente") || "null");

document.querySelectorAll("[data-auth]").forEach((button) => button.addEventListener("click", () => {
  authMode = button.dataset.auth;
  document.querySelectorAll("[data-auth]").forEach((tab) => tab.classList.toggle("selected", tab === button));
  document.querySelector("#register-fields").classList.toggle("hidden", authMode !== "cadastro");
  document.querySelector("#auth-submit").textContent = authMode === "login" ? "Entrar" : "Criar minha conta";
  document.querySelector("#auth-form [name=senha]").autocomplete = authMode === "login" ? "current-password" : "new-password";
}));

document.querySelector("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    currentUser = await api(authMode === "login" ? "/usuarios/login" : "/usuarios/cadastro", { method: "POST", body: JSON.stringify(data) });
    sessionStorage.setItem("barbearia-cliente", JSON.stringify(currentUser));
    await renderProfile(); notify(authMode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso.");
  } catch (error) { notify(error.message, true); }
});

document.querySelector("#logout").addEventListener("click", () => {
  currentUser = null; sessionStorage.removeItem("barbearia-cliente"); profilePanel.classList.add("hidden"); authPanel.classList.remove("hidden");
});

document.querySelector("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    currentUser = await api(`/usuarios/${currentUser.id}`, { method: "PUT", body: JSON.stringify(data) });
    sessionStorage.setItem("barbearia-cliente", JSON.stringify(currentUser));
    document.querySelector("#client-name").textContent = currentUser.nome;
    notify("Seus dados foram atualizados.");
  } catch (error) { notify(error.message, true); }
});

function renderHistory(appointments, completedVisits = 0) {
  const count = Number(completedVisits);
  document.querySelector("#visit-count").textContent = count;
  document.querySelector("#loyalty-message").textContent = count >= 10 ? "Você ganhou um corte grátis!" : `Faltam ${10 - (count % 10)} para um corte grátis`;
  document.querySelector("#loyalty-progress").style.width = `${Math.min(count % 10, 10) * 10}%`;
  document.querySelector("#loyalty-dots").innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="loyalty-dot ${i < count % 10 || count > 0 && count % 10 === 0 ? "filled" : ""}"></span>`).join("");
  document.querySelector("#history-list").innerHTML = appointments.length ? appointments.map((item) => `<article class="history-item"><div class="history-top"><b>${escapeHtml(item.servico.nome)}</b><strong>${money(item.valor)}</strong></div><p class="history-meta">${formatDate(item.data)} · ${String(item.horario).slice(0, 5)} · ${escapeHtml(item.status)}</p>${item.observacao ? `<p class="history-note">“${escapeHtml(item.observacao)}”</p>` : ""}</article>`).join("") : `<p class="muted">Nenhum atendimento ainda. <a href="/" class="gold-text">Agende agora</a>.</p>`;
}

async function renderProfile() {
  if (!currentUser?.id) return;
  try {
    currentUser = await api("/usuarios/sessao", { method: "POST", body: JSON.stringify({ id: String(currentUser.id) }) });
    const [appointments, visitData] = await Promise.all([api(`/agendamentos/cliente/${currentUser.id}`), api(`/usuarios/${currentUser.id}/visitas`)]);
    sessionStorage.setItem("barbearia-cliente", JSON.stringify(currentUser));
    authPanel.classList.add("hidden"); profilePanel.classList.remove("hidden");
    document.querySelector("#client-name").textContent = currentUser.nome;
    const profile = document.querySelector("#profile-form");
    for (const [key, value] of Object.entries({ nome: currentUser.nome, telefone: currentUser.telefone, email: currentUser.email, dataNascimento: currentUser.dataNascimento || "", preferenciaCorte: currentUser.preferenciaCorte || "" })) profile.elements[key].value = value;
    renderHistory(appointments, visitData.concluidas);
  } catch (error) {
    if (authPanel.classList.contains("hidden")) {
      currentUser = null; sessionStorage.removeItem("barbearia-cliente");
      authPanel.classList.remove("hidden"); profilePanel.classList.add("hidden");
      notify(error.message, true);
    }
  }
}

renderProfile();
