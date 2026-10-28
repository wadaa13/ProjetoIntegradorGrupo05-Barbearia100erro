import { api, dateKey, escapeHtml, formatDate, money, notify } from "./api.js";

const model = { services: [], promos: [], selectedService: null, date: null, time: null, slots: [], days: [], paymentMode: "sinal" };
const timeSlots = Array.from({ length: 13 }, (_, index) => { const minutes = 600 + index * 40; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; });
const serviceList = document.querySelector("#service-list");
const dateList = document.querySelector("#date-list");
const timeList = document.querySelector("#time-list");
const continueButton = document.querySelector("#continue-booking");

function renderPromotions() {
  const container = document.querySelector("#promocoes");
  if (!model.promos.length) { container.classList.add("hidden"); return; }
  container.innerHTML = model.promos.map((promo) => `<article class="promo-card"><span class="badge">${escapeHtml(promo.diasAplicacao || "Oferta especial")}</span><span class="discount">-${Number(promo.porcentagemDesconto || 0)}%</span><h3>${escapeHtml(promo.titulo)}</h3><p>${escapeHtml(promo.descricao || "Condição especial para você.")}</p></article>`).join("");
}

function renderPlans() {
  const plans = [
    { nome: "Plano Prata", preco: 160, descricao: "O plano só inclui corte, um serviço por vez na semana." },
    { nome: "Plano Ouro", preco: 200, descricao: "O plano inclui corte e barba, um serviço por vez na semana." },
    { nome: "Plano Prime", preco: 230, descricao: "O plano é ilimitado, serviço sem limitações." },
  ];
  document.querySelector("#plan-list").innerHTML = plans.map((plan, index) => `<article class="plan-card ${index === 2 ? "featured" : ""}"><p class="eyebrow">${index === 2 ? "Experiência completa" : "Plano mensal"}</p><h3>${plan.nome}</h3><p class="plan-price">${money(plan.preco)}<small> /mês</small></p><p>${plan.descricao}</p><a class="button ${index === 2 ? "" : "button-outline"} button-wide" href="/cliente">Tenho interesse →</a></article>`).join("");
}

function renderReviews() {
  const reviews = [
    { autor: "Cliente da casa", texto: "Atendimento caprichado, ambiente agradável e corte sempre no estilo.", nota: 5 },
    { autor: "Quem já conhece", texto: "Barbearia de confiança. Pontualidade e atenção em cada detalhe.", nota: 5 },
    { autor: "Avalie no Google", texto: "Sua opinião ajuda outras pessoas a conhecerem a Barbearia 100 Erro.", nota: 5 },
  ];
  document.querySelector("#reviews-summary").textContent = "Tradição e cuidado em cada atendimento.";
  document.querySelector("#review-list").innerHTML = reviews.map((review) => `<figure class="review-card"><span class="stars" aria-label="${review.nota} de 5 estrelas">★★★★★</span><blockquote>“${escapeHtml(review.texto)}”</blockquote><figcaption class="review-author"><span>${escapeHtml(review.autor)}</span><span class="stars">★★★★★</span></figcaption></figure>`).join("");
}

function renderServices() {
  serviceList.innerHTML = model.services.map((service) => {
    const tuesdayPrice = service.promocaoTerca && model.date && new Date(`${model.date}T12:00:00`).getDay() === 2 ? Number(service.precoTerca) : null;
    const price = tuesdayPrice ?? Number(service.preco);
    return `<button class="service-card ${model.selectedService?.id === service.id ? "selected" : ""}" data-service="${service.id}"><div class="service-top"><h3>${escapeHtml(service.nome)}</h3><span class="service-price">${tuesdayPrice ? `<s class="muted">${money(service.preco)}</s> ` : ""}${money(price)}</span></div>${tuesdayPrice ? `<span class="service-duration promo-label">Terça-feira · ${money(price)}</span>` : ""}<p>${escapeHtml(service.descricao)}</p><span class="service-duration">◷ ${service.duracaoMinutos} MIN</span></button>`;
  }).join("");
  serviceList.querySelectorAll("[data-service]").forEach((button) => button.addEventListener("click", () => {
  model.selectedService = model.services.find((service) => service.id === Number(button.dataset.service));
    renderServices(); renderSummary();
  }));
}

function renderDates() {
  const today = new Date();
  model.days = [];
  const cursor = new Date(today); cursor.setHours(12, 0, 0, 0);
  while (model.days.length < 14) { if (cursor.getDay() !== 0) model.days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
  dateList.innerHTML = model.days.map((date) => {
    const key = dateKey(date); const closed = date.getDay() === 0;
    return `<button class="date-button ${model.date === key ? "selected" : ""}" data-date="${key}" ${closed ? "disabled" : ""}><span>${date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span><b>${date.getDate()}</b></button>`;
  }).join("");
  dateList.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
}

async function selectDate(date) {
  model.date = date; model.time = null; model.slots = [];
  renderServices();
  dateList.querySelectorAll(".date-button").forEach((button) => button.classList.toggle("selected", button.dataset.date === date));
  document.querySelector("#slot-hint").textContent = "Consultando horários livres…";
  timeList.innerHTML = ""; renderSummary();
  try {
    model.slots = await api(`/agendamentos/disponibilidade?data=${date}`);
    document.querySelector("#slot-hint").textContent = model.slots.length ? "Escolha um dos horários disponíveis." : "Não há horários disponíveis para este dia.";
    renderTimes();
  } catch (error) { document.querySelector("#slot-hint").textContent = error.message; notify(error.message, true); }
}

function renderTimes() {
  timeList.innerHTML = timeSlots.map((time) => `<button class="time-button ${model.time === time ? "selected" : ""}" data-time="${time}" ${!model.slots.includes(time) ? "disabled" : ""}>${time}</button>`).join("");
  timeList.querySelectorAll("[data-time]").forEach((button) => button.addEventListener("click", () => {
    model.time = button.dataset.time; renderTimes(); renderSummary();
  }));
}

function renderSummary() {
  const service = model.selectedService;
  const amount = service ? priceForDate(service, model.date) : 0;
  document.querySelector("#summary-service").textContent = service?.nome || "—";
  document.querySelector("#summary-date").textContent = model.date ? formatDate(model.date, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  document.querySelector("#summary-time").textContent = model.time?.slice(0, 5) || "—";
  document.querySelector("#summary-price").textContent = service ? money(amount) : "—";
  continueButton.disabled = !(service && model.date && model.time);
  document.querySelector("#deposit-price").textContent = service ? money(amount * .3) : money(0);
  document.querySelector("#total-price").textContent = service ? money(amount) : money(0);
  const submit = document.querySelector("#booking-form button[type=submit]");
  submit.textContent = service ? `Pagar ${money(model.paymentMode === "sinal" ? amount * .3 : amount)} e reservar →` : "Pagar e reservar →";
}

function priceForDate(service, date) {
  return service.promocaoTerca && date && new Date(`${date}T12:00:00`).getDay() === 2 && service.precoTerca != null
    ? Number(service.precoTerca) : Number(service.preco);
}

continueButton.addEventListener("click", () => {
  continueButton.classList.add("hidden"); document.querySelector("#checkout").classList.remove("hidden");
  document.querySelector("#booking-aside h3").textContent = "Pagamento";
  document.querySelector("#checkout").scrollIntoView({ behavior: "smooth", block: "nearest" });
});
document.querySelectorAll(".pay-choice").forEach((button) => button.addEventListener("click", () => {
  model.paymentMode = button.dataset.mode;
  document.querySelectorAll(".pay-choice").forEach((choice) => choice.classList.toggle("selected", choice === button)); renderSummary();
}));
document.querySelector("#back-booking").addEventListener("click", () => {
  document.querySelector("#checkout").classList.add("hidden"); continueButton.classList.remove("hidden");
  document.querySelector("#booking-aside h3").textContent = "Resumo";
});
document.querySelector("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.currentTarget));
  const paid = priceForDate(model.selectedService, model.date) * (model.paymentMode === "sinal" ? .3 : 1);
  try {
    const reservation = await api("/agendamentos", { method: "POST", body: JSON.stringify({ ...form, servicoId: String(model.selectedService.id), data: model.date, horario: model.time, valorPago: paid.toFixed(2), metodoPagamento: "cartao" }) });
    sessionStorage.setItem("barbearia-cliente", JSON.stringify({ id: reservation.cliente.id, nome: reservation.cliente.nome, email: reservation.cliente.email, telefone: reservation.cliente.telefone }));
    document.querySelector("#booking-aside").innerHTML = `<div class="success-mark">✓</div><p class="eyebrow">Reserva confirmada</p><h3>Horário garantido!</h3><p class="muted">${escapeHtml(reservation.servico.nome)}<br>${formatDate(reservation.data)} às ${String(reservation.horario).slice(0, 5)}</p><p>Pago: <b class="gold-text">${money(reservation.valorPago)}</b></p><p class="fine-print">Pagamento simulado · sua reserva foi salva.</p><a class="button button-wide" href="/cliente">Ver minha conta</a>`;
    notify("Agendamento confirmado. Até lá!");
  } catch (error) { notify(error.message, true); }
});

async function start() {
  try {
    [model.services, model.promos] = await Promise.all([api("/servicos"), api("/promocoes")]);
    renderPromotions(); renderServices(); renderDates(); renderSummary(); renderPlans(); renderReviews();
  } catch (error) { notify(`Não foi possível carregar o catálogo: ${error.message}`, true); }
}
start();
