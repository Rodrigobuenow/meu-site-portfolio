const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuList = document.getElementById("menuList");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const form = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");
const currentYear = document.getElementById("currentYear");
const submitButton = form.querySelector("button[type='submit']");

const THEME_KEY = "portfolio-theme";
const DESTINATION_EMAIL = "rodrigo.buenow@gmail.com";

function setTheme(theme) {
  if (theme === "dark") {
    body.classList.add("dark");
    themeLabel.textContent = "Tema claro";
  } else {
    body.classList.remove("dark");
    themeLabel.textContent = "Tema escuro";
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    setTheme(savedTheme);
  }
}

function toggleTheme() {
  const isDark = body.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  setTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

function toggleMenu() {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuList.classList.toggle("open");
}

function closeMenuOnLinkClick(event) {
  if (event.target.matches("a") && menuList.classList.contains("open")) {
    menuList.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.classList.remove("error", "success");
  formMessage.classList.add(type);
}

async function sendContactEmail(nome, email, mensagem) {
  const endpoint = `https://formsubmit.co/ajax/${DESTINATION_EMAIL}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: nome,
      email,
      message: mensagem,
      _subject: "Nova mensagem do portfólio",
      _template: "table",
      _captcha: "false",
    }),
  });

  const rawBody = await response.text();
  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch (parseError) {
    payload = null;
  }

  // Alguns ambientes retornam 200 com HTML/texto de erro em vez de JSON.
  const hasAuthText = rawBody.toLowerCase().includes("auth");

  if (!response.ok) {
    const details =
      (payload && (payload.message || payload.error)) ||
      (hasAuthText
        ? "Authentication error no provedor de envio."
        : "Falha no envio");

    throw new Error(details);
  }

  if (hasAuthText) {
    throw new Error("Authentication error no provedor de envio.");
  }

  if (payload && payload.success === false) {
    throw new Error(payload.message || "Falha no envio");
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const mensagem = form.mensagem.value.trim();

  // Validação obrigatória dos campos do formulário
  if (!nome || !email || !mensagem) {
    showMessage("Preencha nome, e-mail e mensagem.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage(
      "Informe um e-mail em formato válido (exemplo: usuario@dominio.com).",
      "error",
    );
    return;
  }

  if (DESTINATION_EMAIL === "seuemail@dominio.com") {
    showMessage(
      "Configure seu e-mail no script.js para ativar o envio real.",
      "error",
    );
    return;
  }

  // Em file:// o navegador pode bloquear requisicoes externas por CORS.
  if (window.location.protocol === "file:") {
    showMessage(
      "Para testar envio local, rode em http://localhost (ex.: Live Server).",
      "error",
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    await sendContactEmail(nome, email, mensagem);
    form.reset();
    showMessage("Mensagem enviada com sucesso!", "success");
  } catch (error) {
    const message = String(error.message || "").toLowerCase();

    if (message.includes("confirm") || message.includes("activate")) {
      showMessage(
        "Verifique seu e-mail e confirme a ativacao do FormSubmit para liberar os envios.",
        "error",
      );
    } else if (message.includes("auth")) {
      showMessage(
        "Falha de autenticacao no servico de envio. Tente novamente hospedado no dominio final e confirme o e-mail no FormSubmit.",
        "error",
      );
    } else {
      showMessage(
        "Nao foi possivel enviar agora. Tente novamente em instantes.",
        "error",
      );
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar mensagem";
  }
}

function revealOnScroll() {
  const revealElements = document.querySelectorAll(".section, .card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
    },
  );

  revealElements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}

currentYear.textContent = new Date().getFullYear();
loadSavedTheme();
revealOnScroll();

menuToggle.addEventListener("click", toggleMenu);
menuList.addEventListener("click", closeMenuOnLinkClick);
themeToggle.addEventListener("click", toggleTheme);
form.addEventListener("submit", handleContactSubmit);
