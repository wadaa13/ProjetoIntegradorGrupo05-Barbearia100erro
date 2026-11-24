import { api, dateKey, escapeHtml, formatDate, money, notify } from "./api.js";

const model = { services: [], promos: [], serviceId: null, date: null, time: null, slots: [], paymentMode: "sinal" };
const timeSlots = Array.from({ length: 17 }, (_, index) => { const minutes = 9 * 60 + index * 40; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; });
const $ = (selector) => document.querySelector(selector);
const serviceList = $("#service-list"), dateList = $("#date-list"), timeList = $("#time-list"), continueButton = $("#continue-booking");
function currentClient() { try { return JSON.parse(sessionStorage.getItem("barbearia-cliente") || "null"); } catch { return null; } }
function dateDays() {
  const days = [], cursor = new Date(); cursor.setHours(12, 0, 0, 0);
  while (days.length < 14) { if (cursor.getDay() !== 0 && cursor.getDay() !== 1) days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
  return days;
}
function priceForDate(service, date = model.date) {
  return service?.promocaoTerca && service.precoTerca != null && date && new Date(`${date}T12:00:00`).getDay() === 2 ? Number(service.precoTerca) : Number(service?.preco || 0);
}
function renderPromotions() {
  model.promos = [];
}
function renderServices() {
  serviceList.innerHTML = model.services.map((service) => {
    const price = priceForDate(service), tuesday = price < Number(service.preco);
    return `<button class="service-card ${String(model.serviceId) === String(service.id) ? "selected" : ""}" data-service="${service.id}" aria-pressed="${String(model.serviceId) === String(service.id)}"><div class="service-top"><h3><span class="scissor-mark" aria-hidden="true">✂</span>${escapeHtml(service.nome)}</h3><span class="service-price">${tuesday ? `<s>${money(service.preco)}</s> ` : ""}${money(price)}</span></div>${tuesday ? `<span class="service-duration promo-label">Terça-feira · ${money(price)}</span>` : ""}<p>${escapeHtml(service.descricao || "")}</p><span class="service-duration">${Number(service.duracaoMinutos || 0)} min</span></button>`;
  }).join("");
  serviceList.querySelectorAll("[data-service]").forEach((button) => button.addEventListener("click", () => { model.serviceId = button.dataset.service; renderServices(); renderSummary(); }));
}
function renderDates() {
  dateList.innerHTML = dateDays().map((date) => {
    const key = dateKey(date);
    return `<button class="date-button ${model.date === key ? "selected" : ""}" data-date="${key}" aria-pressed="${model.date === key}"><span>${date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span><b>${date.getDate()}</b><small>${date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</small></button>`;
  }).join("");
  dateList.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
}
async function selectDate(date) {
  model.date = date; model.time = null; model.slots = [];
  renderDates(); renderServices(); renderSummary();
  $("#slot-hint").textContent = "Consultando horários livres…";
  timeList.innerHTML = "";
  try {
    const available = await api(`/agendamentos/disponibilidade?data=${encodeURIComponent(date)}`);
    model.slots = available.map((value) => String(value).slice(0, 5));
    $("#slot-hint").textContent = model.slots.length ? "Escolha um dos horários disponíveis." : "Não há horários disponíveis para este dia.";
    renderTimes();
  } catch (error) { $("#slot-hint").textContent = error.message; notify(error.message, true); }
}
function renderTimes() {
  timeList.innerHTML = timeSlots.map((time) => `<button class="time-button ${model.time === time ? "selected" : ""}" data-time="${time}" ${!model.slots.includes(time) ? "disabled" : ""} aria-pressed="${model.time === time}">${time}</button>`).join("");
  timeList.querySelectorAll("[data-time]").forEach((button) => button.addEventListener("click", () => { model.time = button.dataset.time; renderTimes(); renderSummary(); }));
}
function renderSummary() {
  const service = model.services.find((item) => String(item.id) === String(model.serviceId)), amount = priceForDate(service);
  $("#summary-service").textContent = service?.nome || "—";
  $("#summary-date").textContent = model.date ? formatDate(model.date, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  $("#summary-time").textContent = model.time || "—";
  $("#summary-price").textContent = service ? money(amount) : "—";
  continueButton.disabled = !(service && model.date && model.time);
  $("#deposit-price").textContent = money(amount * .3); $("#total-price").textContent = money(amount);
  const submit = $("#booking-form button[type=submit]");
  if (submit) submit.innerHTML = `Pagar ${money(model.paymentMode === "sinal" ? amount * .3 : amount)} e reservar <span aria-hidden="true">→</span>`;
}
function renderPlans() {
  const plans = [
    { nome: "Plano Prata", preco: 160, descricao: "O plano só inclui corte, um serviço por vez na semana." },
    { nome: "Plano Ouro", preco: 200, descricao: "O plano inclui corte e barba, um serviço por vez na semana." },
    { nome: "Plano Prime", preco: 230, descricao: "O plano é ilimitado, podendo realizar corte e barba por tempo e vezes ilimitadas." },
  ];
  $("#plan-list").innerHTML = plans.map((plan, index) => `<article class="plan-card ${index === 2 ? "featured" : ""}"><p class="eyebrow">${index === 2 ? "Experiência completa" : "Plano mensal"}</p><h3>${plan.nome}</h3><p class="plan-price">${money(plan.preco)}<small> /mês</small></p><p>${plan.descricao}</p><a class="button ${index === 2 ? "" : "button-outline"} button-wide" href="/cliente">Quero esse <span aria-hidden="true">→</span></a></article>`).join("");
}
function renderReviews() {
  const track = $("#review-list"), reviews = [...track.querySelectorAll("[data-review]")];
  if (!reviews.length) return;
  let activeIndex = 0;
  const prev = $("#review-prev"), next = $("#review-next"), position = $("#review-position");
  const showReview = (index) => {
    activeIndex = (index + reviews.length) % reviews.length;
    reviews.forEach((review, i) => { review.hidden = i !== activeIndex; });
    position.textContent = `Avaliação ${activeIndex + 1} de ${reviews.length}`;
    prev.disabled = reviews.length < 2;
    next.disabled = reviews.length < 2;
  };
  prev.addEventListener("click", () => showReview(activeIndex - 1));
  next.addEventListener("click", () => showReview(activeIndex + 1));
  showReview(0);
}

continueButton.addEventListener("click", () => {
  continueButton.classList.add("hidden"); $("#checkout").classList.remove("hidden"); $("#booking-aside h3").textContent = "Pagamento";
  const client = currentClient(), form = $("#booking-form");
  if (client?.id) form.innerHTML = `<p class="account-hint">Agendando como <strong>${escapeHtml(client.nome)}</strong>.</p><button class="button button-wide" type="submit">Pagar e reservar <span aria-hidden="true">→</span></button>`;
  renderSummary(); $("#checkout").scrollIntoView({ behavior: "smooth", block: "nearest" });
});
document.querySelectorAll(".pay-choice").forEach((button) => button.addEventListener("click", () => { model.paymentMode = button.dataset.mode; document.querySelectorAll(".pay-choice").forEach((choice) => choice.classList.toggle("selected", choice === button)); renderSummary(); }));
$("#back-booking").addEventListener("click", () => { $("#checkout").classList.add("hidden"); continueButton.classList.remove("hidden"); $("#booking-aside h3").textContent = "Resumo do agendamento"; });
$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const client = currentClient(), service = model.services.find((item) => String(item.id) === String(model.serviceId));
  if (!service || !model.date || !model.time) return;
  const form = client?.id ? { clienteId: String(client.id) } : Object.fromEntries(new FormData(event.currentTarget));
  const paid = priceForDate(service) * (model.paymentMode === "sinal" ? .3 : 1);
  try {
    const booking = await api("/agendamentos", { method: "POST", body: JSON.stringify({ ...form, servicoId: String(service.id), data: model.date, horario: model.time, valorPago: paid.toFixed(2), metodoPagamento: "cartao" }) });
    if (booking.cliente) sessionStorage.setItem("barbearia-cliente", JSON.stringify({ id: booking.cliente.id, nome: booking.cliente.nome, email: booking.cliente.email, telefone: booking.cliente.telefone }));
    $("#booking-aside").innerHTML = `<div class="success-mark">✓</div><p class="eyebrow">Reserva confirmada</p><h3>Horário garantido!</h3><p class="muted">${escapeHtml(booking.servico.nome)}<br>${formatDate(booking.data)} às ${String(booking.horario).slice(0, 5)}</p><p>Pago: <b class="gold-text">${money(booking.valorPago)}</b></p><p class="fine-print">Pagamento simulado · sua reserva foi salva.</p><a class="button button-wide" href="/cliente">Ver minha área</a>`;
    notify("Agendamento confirmado. Até lá!");
  } catch (error) { notify(error.message, true); }
});

async function start() {
  try {
    model.services = await api("/servicos");
    renderPromotions(); renderServices(); renderDates(); renderSummary(); renderPlans(); renderReviews();
    const first = dateDays()[0]; if (first) await selectDate(dateKey(first));
  } catch (error) { notify(`Não foi possível carregar o catálogo: ${error.message}`, true); }
}
start();
