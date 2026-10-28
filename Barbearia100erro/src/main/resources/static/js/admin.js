import { api, dateKey, escapeHtml, formatDate, money, notify } from "./api.js";

const adminLogin = document.querySelector("#admin-login");
const adminPanel = document.querySelector("#admin-panel");
const content = document.querySelector("#admin-content");
const timeSlots = Array.from({ length: 13 }, (_, index) => { const minutes = 600 + index * 40; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; });
const state = { user: JSON.parse(sessionStorage.getItem("barbearia-admin") || "null"), tab: "dashboard", date: dateKey(new Date()), services: [], appointments: [], promos: [], blocked: JSON.parse(localStorage.getItem("barbearia-bloqueios") || "[]"), moving: null };

document.querySelector("#admin-login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    state.user = await api("/admin/login", { method: "POST", body: JSON.stringify(data) });
    sessionStorage.setItem("barbearia-admin", JSON.stringify(state.user));
    await showPanel();
  } catch (error) { notify(error.message, true); }
});
document.querySelector("#admin-logout").addEventListener("click", () => {
  state.user = null; sessionStorage.removeItem("barbearia-admin"); adminPanel.classList.add("hidden"); adminLogin.classList.remove("hidden");
});
document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", async () => {
  state.tab = button.dataset.tab;
  try { if (state.tab === "dashboard") await loadDailyRevenue(); renderTab(); }
  catch (error) { notify(error.message, true); }
}));

async function loadData() {
  const start = "2000-01-01";
  const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
  [state.services, state.promos, state.appointments] = await Promise.all([api("/servicos/todos"), api("/promocoes/todas"), api(`/agendamentos?inicio=${start}&fim=${dateKey(endDate)}`)]);
}
async function showPanel() {
  await loadData(); adminLogin.classList.add("hidden"); adminPanel.classList.remove("hidden");
  if (state.tab === "dashboard") await loadDailyRevenue();
  renderTab();
}
function servicesRanking(appointments) {
  return state.services.map((service) => ({ service, count: appointments.filter((appointment) => appointment.servico.id === service.id).length })).sort((a, b) => b.count - a.count);
}
function renderDashboard() {
  const today = new Date(); const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const rangeSum = (from, to) => state.appointments.filter((a) => a.status !== "CANCELADO" && a.data >= dateKey(from) && a.data <= dateKey(to)).reduce((sum, a) => sum + Number(a.valor || 0), 0);
  const todayItems = state.appointments.filter((a) => a.data === dateKey(today) && a.status !== "CANCELADO");
  const chartDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
  const dailyRevenue = new Map((state.dailyRevenue || []).map((item) => [item.data, Number(item.total)]));
  const bars = chartDays.map((d) => ({ day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), amount: dailyRevenue.get(dateKey(d)) || 0 }));
  const max = Math.max(...bars.map((x) => x.amount), 1);
  content.innerHTML = `<div class="stats-grid"><article class="stat-card"><span class="stat-label">Hoje</span><strong class="stat-value">${money(rangeSum(today, today))}</strong><span class="stat-hint">${todayItems.length} atendimentos</span></article><article class="stat-card"><span class="stat-label">Semana</span><strong class="stat-value">${money(rangeSum(weekStart, today))}</strong><span class="stat-hint">Faturamento registrado</span></article><article class="stat-card"><span class="stat-label">Mês</span><strong class="stat-value">${money(rangeSum(monthStart, today))}</strong><span class="stat-hint">Faturamento acumulado</span></article></div><div class="dashboard-grid"><article class="panel"><p class="eyebrow">Últimos sete dias</p><h3>Faturamento diário</h3><div class="bar-chart">${bars.map((bar) => `<div class="chart-column"><span>${bar.amount ? money(bar.amount).replace(" ", "") : ""}</span><div class="chart-bar" style="height:${Math.max(2, bar.amount / max * 100)}%"></div><span>${bar.day}</span></div>`).join("")}</div></article><article class="panel"><p class="eyebrow">Visão do catálogo</p><h3>Serviços mais vendidos</h3><ul class="ranking-list">${servicesRanking(state.appointments).slice(0, 5).map(({ service, count }) => `<li><span>${escapeHtml(service.nome)}</span><span>${count}</span></li>`).join("")}</ul></article></div>`;
}
function renderAgenda() {
  const date = new Date(`${state.date}T12:00:00`);
  const appointments = state.appointments.filter((a) => a.data === state.date && a.status !== "CANCELADO");
  const blocked = (time) => state.blocked.includes(`${state.date}|${time}`);
  content.innerHTML = `<div class="agenda-layout"><article class="panel"><div class="agenda-toolbar"><button class="icon-button" id="previous-day">←</button><h3>${date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h3><button class="icon-button" id="next-day">→</button></div>${state.moving ? `<p class="birthday-note">Escolha um horário livre para remarcar <button class="text-button" id="cancel-moving">Cancelar</button></p>` : ""}<div>${timeSlots.map((time) => {
    const appointment = appointments.find((a) => String(a.horario).slice(0, 5) === time);
    if (appointment && state.moving === String(appointment.id)) return `<div class="slot-row"><span class="slot-time">${time}</span><div><div class="slot-client">${escapeHtml(appointment.cliente.nome)}</div><div class="slot-service">Selecione outro horário para remarcar</div></div><div class="slot-actions"><button class="small-button" data-cancel-moving>Manter horário</button></div></div>`;
    if (appointment) return `<div class="slot-row"><span class="slot-time">${time}</span><div><div class="slot-client">${escapeHtml(appointment.cliente.nome)}</div><div class="slot-service">${escapeHtml(appointment.servico.nome)}</div></div><div class="slot-actions"><span class="status-pill ${appointment.status === "PENDENTE" ? "pending" : appointment.status === "WALK_IN" ? "walkin" : ""}">${appointment.status === "WALK_IN" ? "walk-in" : appointment.status.toLowerCase()}</span><button class="small-button" data-move="${appointment.id}">Remarcar</button><button class="small-button danger" data-cancel="${appointment.id}">Cancelar</button></div></div>`;
    if (blocked(time)) return `<div class="slot-row"><span class="slot-time">${time}</span><span class="muted">🔒 Bloqueado</span><div class="slot-actions"><button class="small-button" data-block="${time}">Liberar</button></div></div>`;
    if (state.moving) return `<div class="slot-row"><span class="slot-time">${time}</span><span class="muted">Livre</span><div class="slot-actions"><button class="small-button" data-reschedule="${time}">Mover para cá</button></div></div>`;
    return `<div class="slot-row"><span class="slot-time">${time}</span><span class="muted">Livre</span><div class="slot-actions"><button class="small-button" data-block="${time}">Bloquear</button><button class="small-button" data-walkin="${time}">+ Walk-in</button></div></div>`;
  }).join("")}</div></article><aside class="panel"><p class="eyebrow">Registro rápido</p><h3>Atendimento presencial</h3><p class="muted" style="font-size:11px">Adicione um walk-in usando o formulário.</p><form class="form-stack" id="walkin-form"><label>Nome do cliente<input name="nome" required></label><label>WhatsApp<input name="telefone" required></label><label>E-mail<input name="email" type="email" required></label><label>Serviço<select name="servicoId">${state.services.map((service) => `<option value="${service.id}">${escapeHtml(service.nome)}</option>`).join("")}</select></label><label>Horário<select name="horario">${timeSlots.map((time) => `<option value="${time}">${time}</option>`).join("")}</select></label><button class="button button-wide" type="submit">Adicionar walk-in</button></form></aside></div>`;
  document.querySelector("#previous-day").addEventListener("click", () => shiftDate(-1));
  document.querySelector("#next-day").addEventListener("click", () => shiftDate(1));
  document.querySelector("#cancel-moving")?.addEventListener("click", () => { state.moving = null; renderAgenda(); });
  content.querySelectorAll("[data-cancel]").forEach((button) => button.addEventListener("click", () => changeAppointment(button.dataset.cancel, { method: "DELETE" })));
  content.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => { state.moving = button.dataset.move; renderAgenda(); }));
  content.querySelector("[data-cancel-moving]")?.addEventListener("click", () => { state.moving = null; renderAgenda(); });
  content.querySelectorAll("[data-block]").forEach((button) => button.addEventListener("click", () => toggleBlock(button.dataset.block)));
  content.querySelectorAll("[data-walkin]").forEach((button) => button.addEventListener("click", () => walkInAt(button.dataset.walkin)));
  content.querySelectorAll("[data-reschedule]").forEach((button) => button.addEventListener("click", () => changeAppointment(state.moving, { method: "PUT", body: JSON.stringify({ data: state.date, horario: button.dataset.reschedule }) }, true)));
  document.querySelector("#walkin-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = Object.fromEntries(new FormData(event.currentTarget));
    try { await api("/agendamentos", { method: "POST", body: JSON.stringify({ ...form, data: state.date, status: "walk-in", valorPago: "0" }) }); notify("Atendimento presencial adicionado."); await refresh(); }
    catch (error) { notify(error.message, true); }
  });
}
function shiftDate(amount) { const date = new Date(`${state.date}T12:00:00`); date.setDate(date.getDate() + amount); state.date = dateKey(date); renderAgenda(); }
async function changeAppointment(id, options, rescheduled = false) {
  try { await api(`/agendamentos/${id}`, options); state.moving = null; notify(rescheduled ? "Agendamento remarcado." : "Agendamento cancelado."); await refresh(); }
  catch (error) { notify(error.message, true); }
}
function toggleBlock(time) {
  const key = `${state.date}|${time}`;
  state.blocked = state.blocked.includes(key) ? state.blocked.filter((item) => item !== key) : [...state.blocked, key];
  localStorage.setItem("barbearia-bloqueios", JSON.stringify(state.blocked)); renderAgenda();
}
async function walkInAt(time) {
  const name = window.prompt(`Nome do cliente para ${time}:`)?.trim();
  if (!name) return;
  const telephone = window.prompt("WhatsApp do cliente:", "(11) 90000-0000")?.trim();
  if (!telephone) return;
  const email = `walkin-${Date.now()}@100erro.local`;
  const serviceId = state.services[0]?.id;
  if (!serviceId) return notify("Cadastre um serviço antes de lançar um walk-in.", true);
  try {
    await api("/agendamentos", { method: "POST", body: JSON.stringify({ nome: name.trim(), telefone: telephone.trim(), email: email.trim(), servicoId: String(serviceId), data: state.date, horario: time, status: "walk-in", valorPago: "0" }) });
    notify("Atendimento presencial adicionado."); await refresh();
  } catch (error) { notify(error.message, true); }
}
function renderCatalog() {
  content.innerHTML = `<div class="catalog-layout"><article class="panel"><p class="eyebrow">Gestão do catálogo</p><h3>Serviços</h3>${state.services.map((service) => `<div class="admin-service"><div><strong>${escapeHtml(service.nome)}</strong><small>${service.duracaoMinutos} min · ${escapeHtml(service.descricao)}</small></div><input type="number" min="0" step="0.01" value="${service.preco}" aria-label="Preço ${escapeHtml(service.nome)}" data-price="${service.id}"><button class="small-button danger" data-delete-service="${service.id}">Remover</button></div>`).join("")}<form class="field-row" id="new-service"><label class="form-stack">Nome<input name="nome" required></label><label class="form-stack">Preço (R$)<input name="preco" type="number" min="0" step="0.01" required></label><label class="form-stack span-two">Descrição<input name="descricao" required></label><label class="form-stack">Duração (min)<input name="duracaoMinutos" type="number" min="1" value="30" required></label><button class="button" type="submit">Adicionar serviço</button></form></article><aside class="panel"><p class="eyebrow">Ofertas para clientes</p><h3>Promoções</h3><div class="content-stack">${state.promos.filter((p) => p.ativo).map((promo) => `<div class="promo-admin-row"><span>${escapeHtml(promo.titulo)} <b class="gold-text">-${promo.porcentagemDesconto}%</b></span><button class="small-button danger" data-delete-promo="${promo.id}">remover</button></div>`).join("")}</div><form class="form-stack" id="new-promo" style="margin-top:16px"><label>Título<input name="titulo" required></label><label>Descrição<input name="descricao" required></label><label>Desconto (%)<input name="porcentagemDesconto" type="number" min="0" max="100" required></label><label>Dias da promoção<input name="diasAplicacao" placeholder="Todos os dias"></label><button class="button button-wide" type="submit">Criar promoção</button></form><hr class="catalog-divider"><p class="eyebrow">Promoção aplicada no preço</p><label class="form-stack">Preço da Terça do Corte (R$)<input id="tuesday-price" type="number" min="0" step="0.01" value="${state.services.find((service) => service.promocaoTerca)?.precoTerca ?? 35}"></label><button class="button button-outline button-wide" id="save-tuesday-price" style="margin-top:12px">Salvar preço de terça</button></aside></div>`;
  content.querySelectorAll("[data-price]").forEach((input) => input.addEventListener("change", async () => {
    const service = state.services.find((item) => item.id === Number(input.dataset.price));
    try { await api(`/servicos/${service.id}`, { method: "PUT", body: JSON.stringify({ ...service, preco: Number(input.value) }) }); notify("Preço atualizado."); await refresh(); }
    catch (error) { notify(error.message, true); }
  }));
  content.querySelectorAll("[data-delete-service]").forEach((button) => button.addEventListener("click", async () => {
    try { await api(`/servicos/${button.dataset.deleteService}`, { method: "DELETE" }); notify("Serviço removido do catálogo."); await refresh(); }
    catch (error) { notify(error.message, true); }
  }));
  content.querySelectorAll("[data-delete-promo]").forEach((button) => button.addEventListener("click", async () => {
    try { await api(`/promocoes/${button.dataset.deletePromo}`, { method: "DELETE" }); notify("Promoção removida."); await refresh(); }
    catch (error) { notify(error.message, true); }
  }));
  document.querySelector("#new-service").addEventListener("submit", async (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await api("/servicos", { method: "POST", body: JSON.stringify({ ...data, preco: Number(data.preco), duracaoMinutos: Number(data.duracaoMinutos), ativo: true }) }); notify("Serviço cadastrado."); await refresh(); }
    catch (error) { notify(error.message, true); }
  });
  document.querySelector("#new-promo").addEventListener("submit", async (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await api("/promocoes", { method: "POST", body: JSON.stringify({ ...data, porcentagemDesconto: Number(data.porcentagemDesconto), ativo: true }) }); notify("Promoção criada."); await refresh(); }
    catch (error) { notify(error.message, true); }
  });
  document.querySelector("#save-tuesday-price").addEventListener("click", async () => {
    const service = state.services.find((item) => item.promocaoTerca);
    if (!service) return notify("O serviço Corte não foi encontrado no catálogo.", true);
    const precoTerca = Number(document.querySelector("#tuesday-price").value);
    try { await api(`/servicos/${service.id}`, { method: "PUT", body: JSON.stringify({ ...service, precoTerca, promocaoTerca: true }) }); notify("Preço de terça atualizado."); await refresh(); }
    catch (error) { notify(error.message, true); }
  });
}
async function renderClients() {
  try {
    const clients = await api("/admin/clientes");
    content.innerHTML = `<article class="panel"><p class="eyebrow">Relacionamento</p><h3>Clientes cadastrados</h3>${clients.length ? clients.map((client) => `<div class="client-row"><strong>${escapeHtml(client.nome)}</strong><span>${escapeHtml(client.telefone)}</span><small>${escapeHtml(client.email)} · ${client.dataNascimento ? `Aniversário ${formatDate(client.dataNascimento, { day: "2-digit", month: "long" })}` : "Sem aniversário cadastrado"}</small></div>`).join("") : `<p class="muted">Os clientes cadastrados aparecerão aqui.</p>`}</article>`;
  } catch (error) { notify(error.message, true); }
}
function renderTab() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("selected", button.dataset.tab === state.tab));
  if (state.tab === "dashboard") renderDashboard();
  if (state.tab === "agenda") renderAgenda();
  if (state.tab === "catalogo") renderCatalog();
  if (state.tab === "clientes") renderClients();
}
async function refresh() { await loadData(); if (state.tab === "dashboard") await loadDailyRevenue(); renderTab(); }

async function loadDailyRevenue() {
  const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 6);
  state.dailyRevenue = await api(`/admin/dashboard/diario?inicio=${dateKey(start)}&fim=${dateKey(end)}`);
}

if (state.user) showPanel().catch((error) => { state.user = null; sessionStorage.removeItem("barbearia-admin"); notify(error.message, true); });
