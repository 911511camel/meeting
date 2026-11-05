(function () {
  "use strict";

  /* NIKOLAS SEGURADO · Bilingual Bridge access layer
     gate (EN/RU) -> register / sign-in -> room -> session (1x password) */

  var ACCESS_CODE = "NIKOLAS-2077";
  var K = {
    users: "nsa.v1.users", current: "nsa.v1.current", sessions: "nsa.v1.sessions",
    unlock: "nsa.v1.unlock", gate: "nsa.v1.gate", lang: "nsa.v1.lang"
  };
  var ROOMS = [{ id: "Crypto", icon: "\u2311" }, { id: "Bank protocols", icon: "\u25a3" }];
  var LANGS = [
    { id: "en", label: "English" }, { id: "ru", label: "Русский" }, { id: "es", label: "Español" },
    { id: "tl", label: "Tagalog" }, { id: "zh", label: "中文" }, { id: "ar", label: "العربية" },
    { id: "fr", label: "Français" }, { id: "de", label: "Deutsch" }
  ];

  var I18N = {
    en: {
      "gate.sub": "Password protected terminal. Enter the access code to open the identity layer.",
      "gate.codeLabel": "Access code", "gate.ph": "access code", "gate.btn": "UNLOCK TERMINAL",
      "gate.hintHtml": "Default code: <code>NIKOLAS-2077</code> — change <code>ACCESS_CODE</code> in app.js",
      "gate.err": "Invalid access code.",
      "auth.kicker": "IDENTITY LAYER", "auth.title": "DEAL ROOM ACCESS",
      "auth.sub": "Register with your name, a password and the languages you speak. Existing members can sign in.",
      "auth.tabReg": "REGISTER", "auth.tabIn": "SIGN IN", "auth.name": "Name",
      "auth.namePh": "Nikolas Segurado", "auth.pass": "Password", "auth.passPh": "min. 4 characters",
      "auth.langs": "Languages you speak", "auth.regBtn": "CREATE ACCOUNT", "auth.inBtn": "ENTER DEAL ROOMS",
      "err.name": "Name must be 2-24 characters.", "err.pass": "Password must be at least 4 characters.",
      "err.langs": "Pick at least one language you speak.", "err.exists": "That name is already registered. Sign in instead.",
      "err.nouser": "No account with that name.", "err.wrongpass": "Wrong password.",
      "rooms.title": "CHOOSE ROOM", "rooms.sub": "Rooms hold sessions. Every session is password protected on creation.",
      "rooms.signedAs": "SIGNED IN AS {name}", "rooms.signout": "SIGN OUT",
      "room.crypto": "Crypto", "room.cryptoDesc": "buyer \u2194 seller \u00b7 OTC & escrow",
      "room.bank": "Bank protocols", "room.bankDesc": "private bank-protocol negotiation",
      "sessions.title": "{room} \u00b7 SESSIONS",
      "sessions.sub": "Join an existing session or create a new one. A session password is asked once per browser tab.",
      "sessions.back": "\u2190 ROOMS", "sessions.emptyHtml": "No sessions in this room yet.<br>Create the first one \u2014 it will be password protected.",
      "sessions.newBtn": "+ NEW SESSION", "sessions.lock": "\u{1F512} LOCKED",
      "sessions.signedAs": "SIGNED IN AS {name}", "sessions.meta": "by {owner} \u00b7 {date} \u00b7 {msgs}",
      "unlock.title": "UNLOCK SESSION", "unlock.sub": "{name} \u2014 protected by password. Asked once per browser tab.",
      "unlock.label": "Session password", "unlock.ok": "UNLOCK", "unlock.err": "Wrong session password.",
      "create.title": "NEW SESSION", "create.sub": "Room: {room}. The password is entered once per tab when someone opens this session.",
      "create.name": "Session name", "create.namePh": "e.g. 2 BTC OTC \u2014 test tranche",
      "create.pass": "Session password", "create.passPh": "min. 4 characters", "create.pass2": "Repeat password",
      "create.ok": "CREATE SESSION", "create.errPass": "Password must be at least 4 characters.",
      "create.errMatch": "Passwords do not match.", "create.defaultName": "Deal {date}",
      "common.cancel": "CANCEL", "bar.lock": "PASSWORD \u00b7 UNLOCKED", "bar.count": "{n} messages in history",
      "bar.sessions": "SESSIONS", "bar.signout": "SIGN OUT",
      "sys.created": "Session created by {name} \u00b7 {date} \u00b7 password protected"
    },
    ru: {
      "gate.sub": "Защищённый терминал. Введите код доступа, чтобы открыть уровень идентификации.",
      "gate.codeLabel": "Код доступа", "gate.ph": "код доступа", "gate.btn": "РАЗБЛОКИРОВАТЬ ТЕРМИНАЛ",
      "gate.hintHtml": "Код по умолчанию: <code>NIKOLAS-2077</code> — измените <code>ACCESS_CODE</code> в app.js",
      "gate.err": "Неверный код доступа.",
      "auth.kicker": "УРОВЕНЬ ИДЕНТИФИКАЦИИ", "auth.title": "ДОСТУП К ПЕРЕГОВОРНОЙ",
      "auth.sub": "Зарегистрируйтесь: имя, пароль и языки, на которых вы говорите. Постоянные участники могут войти.",
      "auth.tabReg": "РЕГИСТРАЦИЯ", "auth.tabIn": "ВХОД", "auth.name": "Имя",
      "auth.namePh": "Николас Сегурадо", "auth.pass": "Пароль", "auth.passPh": "мин. 4 символа",
      "auth.langs": "Языки, на которых вы говорите", "auth.regBtn": "СОЗДАТЬ АККАУНТ", "auth.inBtn": "ВОЙТИ В КОМНАТЫ",
      "err.name": "Имя должно быть от 2 до 24 символов.", "err.pass": "Пароль должен быть не короче 4 символов.",
      "err.langs": "Выберите хотя бы один язык.", "err.exists": "Это имя уже занято. Войдите вместо регистрации.",
      "err.nouser": "Аккаунт с таким именем не найден.", "err.wrongpass": "Неверный пароль.",
      "rooms.title": "ВЫБЕРИТЕ КОМНАТУ", "rooms.sub": "В комнатах находятся сессии. Каждая сессия защищена паролем при создании.",
      "rooms.signedAs": "ВХОД КАК {name}", "rooms.signout": "ВЫЙТИ",
      "room.crypto": "Криптовалюта", "room.cryptoDesc": "покупатель \u2194 продавец \u00b7 OTC и эскроу",
      "room.bank": "Банковские протоколы", "room.bankDesc": "частные переговоры по банковским протоколам",
      "sessions.title": "{room} \u00b7 СЕССИИ",
      "sessions.sub": "Присоединитесь к существующей сессии или создайте новую. Пароль сессии спрашивается один раз за вкладку браузера.",
      "sessions.back": "\u2190 КОМНАТЫ", "sessions.emptyHtml": "В этой комнате пока нет сессий.<br>Создайте первую — она будет защищена паролем.",
      "sessions.newBtn": "+ НОВАЯ СЕССИЯ", "sessions.lock": "\u{1F512} ЗАКРЫТО",
      "sessions.signedAs": "ВХОД КАК {name}", "sessions.meta": "создал(а) {owner} \u00b7 {date} \u00b7 {msgs}",
      "unlock.title": "ОТКРЫТЬ СЕССИЮ", "unlock.sub": "{name} — защищена паролем. Спрашивается один раз за вкладку.",
      "unlock.label": "Пароль сессии", "unlock.ok": "ОТКРЫТЬ", "unlock.err": "Неверный пароль сессии.",
      "create.title": "НОВАЯ СЕССИЯ", "create.sub": "Комната: {room}. Пароль вводится один раз за вкладку при открытии сессии.",
      "create.name": "Название сессии", "create.namePh": "напр. 2 BTC OTC — тестовый транш",
      "create.pass": "Пароль сессии", "create.passPh": "мин. 4 символа", "create.pass2": "Повторите пароль",
      "create.ok": "СОЗДАТЬ СЕССИЮ", "create.errPass": "Пароль должен быть не короче 4 символов.",
      "create.errMatch": "Пароли не совпадают.", "create.defaultName": "Сделка {date}",
      "common.cancel": "ОТМЕНА", "bar.lock": "ПАРОЛЬ \u00b7 ОТКРЫТО", "bar.count": "{n} сообщений в истории",
      "bar.sessions": "СЕССИИ", "bar.signout": "ВЫЙТИ",
      "sys.created": "Сессия создана: {name} \u00b7 {date} \u00b7 защищена паролем"
    }
  };

  function load(key, fallback) { try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function sget(key, fallback) { try { var raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function sset(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

  function hashPass(salt, pass) {
    var s = "nsa|" + String(salt).toLowerCase() + "|" + String(pass);
    var h1 = 0x811c9dc5, h2 = 0x9e3779b9;
    for (var round = 0; round < 4000; round++) {
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i) + round;
        h1 ^= c; h1 = (h1 * 0x01000193) >>> 0;
        h2 = ((h2 << 5) - h2 + c) >>> 0;
      }
    }
    return ("00000000" + h1.toString(16)).slice(-8) + ("00000000" + h2.toString(16)).slice(-8);
  }

  var LANG = load(K.lang, "en") === "ru" ? "ru" : "en";
  function t(key) { var p = I18N[LANG] || I18N.en; return p[key] != null ? p[key] : key; }
  function tr(key, vars) { var s = t(key); if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); }); return s; }
  function ruPlural(n, forms) { var a = Math.abs(n) % 100, b = Math.abs(n) % 10; if (a > 10 && a < 20) return forms[2]; if (b > 1 && b < 5) return forms[1]; if (b === 1) return forms[0]; return forms[2]; }
  function msgsLabel(n) { if (LANG === "ru") return n + " " + ruPlural(n, ["сообщение", "сообщения", "сообщений"]); return n + (n === 1 ? " message" : " messages"); }
  function sessionsLabel(n) { if (LANG === "ru") return n + " " + ruPlural(n, ["сессия", "сессии", "сессий"]); return n + " session" + (n === 1 ? "" : "s"); }
  function roomLabel(id) { return id === "Crypto" ? t("room.crypto") : t("room.bank"); }
  function roomDesc(id) { return id === "Crypto" ? t("room.cryptoDesc") : t("room.bankDesc"); }

  var users = load(K.users, []), sessions = load(K.sessions, []), unlocked = sget(K.unlock, {});
  var me = null, roomId = null, active = null, chosenLangs = [], currentTab = "register";
  var modalOkHandler = null, replaying = false, syncTimer = null, syncingLang = false;

  function $(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function val(id) { var el = $(id); return el ? el.value : ""; }
  function setErr(id, msg) { var el = $(id); if (el) el.textContent = msg || ""; }
  function toHex(c) {
    if (!c) return "#00f0ff";
    if (c.charAt(0) === "#") return c;
    var m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return "#00f0ff";
    return "#" + m[1].split(",").slice(0, 3).map(function (n) { var v = ("0" + parseInt(n, 10).toString(16)).slice(-2); return v.length > 2 ? v.slice(-2) : v; }).join("");
  }

  var bridge = $("bridge");
  var messagesEl = $("messages");

  function langSwitchHTML() {
    return '<div class="nsa-lang-switch" id="nsa-lang-switch" role="group" aria-label="Interface language">' +
      '<button type="button" data-lang="en" class="' + (LANG === "en" ? "active" : "") + '">EN</button>' +
      '<button type="button" data-lang="ru" class="' + (LANG === "ru" ? "active" : "") + '">RU</button></div>';
  }

  function screensHTML() {
    return langSwitchHTML() +
      '<section class="nsa-screen" id="nsa-gate"><div class="nsa-card">' +
        '<div class="nsa-kicker">NIKOLAS SEGURADO — STARTUP PROJECT</div>' +
        '<h2 class="nsa-title">BILINGUAL BRIDGE</h2>' +
        '<p class="nsa-sub">' + esc(t("gate.sub")) + '</p>' +
        '<label class="nsa-label" for="nsa-gate-code">' + esc(t("gate.codeLabel")) + '</label>' +
        '<input class="nsa-input" id="nsa-gate-code" type="password" autocomplete="off" placeholder="' + esc(t("gate.ph")) + '">' +
        '<div class="nsa-error" id="nsa-gate-error"></div>' +
        '<button class="nsa-btn primary" id="nsa-gate-btn" type="button">' + esc(t("gate.btn")) + '</button>' +
        '<p class="nsa-hint">' + t("gate.hintHtml") + '</p></div></section>' +
      '<section class="nsa-screen" id="nsa-auth"><div class="nsa-card">' +
        '<div class="nsa-kicker">' + esc(t("auth.kicker")) + '</div>' +
        '<h2 class="nsa-title">' + esc(t("auth.title")) + '</h2>' +
        '<p class="nsa-sub">' + esc(t("auth.sub")) + '</p>' +
        '<div class="nsa-tabs">' +
          '<button class="nsa-tab" type="button" data-auth-tab="register">' + esc(t("auth.tabReg")) + '</button>' +
          '<button class="nsa-tab" type="button" data-auth-tab="signin">' + esc(t("auth.tabIn")) + '</button></div>' +
        '<div id="nsa-register-pane">' +
          '<label class="nsa-label" for="nsa-reg-name">' + esc(t("auth.name")) + '</label>' +
          '<input class="nsa-input" id="nsa-reg-name" maxlength="24" autocomplete="off" placeholder="' + esc(t("auth.namePh")) + '">' +
          '<label class="nsa-label" for="nsa-reg-pass">' + esc(t("auth.pass")) + '</label>' +
          '<input class="nsa-input" id="nsa-reg-pass" type="password" autocomplete="new-password" placeholder="' + esc(t("auth.passPh")) + '">' +
          '<label class="nsa-label">' + esc(t("auth.langs")) + '</label><div class="nsa-chips" id="nsa-langs"></div>' +
          '<div class="nsa-error" id="nsa-reg-error"></div>' +
          '<button class="nsa-btn primary" id="nsa-reg-btn" type="button">' + esc(t("auth.regBtn")) + '</button></div>' +
        '<div id="nsa-signin-pane" style="display:none">' +
          '<label class="nsa-label" for="nsa-in-name">' + esc(t("auth.name")) + '</label>' +
          '<input class="nsa-input" id="nsa-in-name" maxlength="24" autocomplete="off">' +
          '<label class="nsa-label" for="nsa-in-pass">' + esc(t("auth.pass")) + '</label>' +
          '<input class="nsa-input" id="nsa-in-pass" type="password" autocomplete="current-password">' +
          '<div class="nsa-error" id="nsa-in-error"></div>' +
          '<button class="nsa-btn primary" id="nsa-in-btn" type="button">' + esc(t("auth.inBtn")) + '</button></div></div></section>' +
      '<section class="nsa-screen" id="nsa-rooms"><div class="nsa-card">' +
        '<div class="nsa-kicker" id="nsa-rooms-kicker"></div>' +
        '<h2 class="nsa-title">' + esc(t("rooms.title")) + '</h2>' +
        '<p class="nsa-sub">' + esc(t("rooms.sub")) + '</p><div id="nsa-rooms-list"></div>' +
        '<div class="nsa-row" style="margin-top:16px"><button class="nsa-btn ghost" id="nsa-rooms-signout" type="button">' + esc(t("rooms.signout")) + '</button></div></div></section>' +
      '<section class="nsa-screen" id="nsa-sessions"><div class="nsa-card">' +
        '<button class="nsa-back" id="nsa-sessions-back" type="button">' + esc(t("sessions.back")) + '</button>' +
        '<div class="nsa-kicker" id="nsa-sessions-kicker"></div>' +
        '<h2 class="nsa-title" id="nsa-sessions-title"></h2>' +
        '<p class="nsa-sub">' + esc(t("sessions.sub")) + '</p><div class="nsa-list" id="nsa-sessions-list"></div>' +
        '<button class="nsa-btn primary" id="nsa-new-session" type="button">' + esc(t("sessions.newBtn")) + '</button>' +
        '<div class="nsa-row" style="margin-top:10px"><button class="nsa-btn ghost" id="nsa-sessions-signout" type="button">' + esc(t("rooms.signout")) + '</button></div></div></section>' +
      '<section class="nsa-screen" id="nsa-modal"><div class="nsa-card" style="max-width:440px">' +
        '<h2 class="nsa-title" id="nsa-modal-title"></h2><p class="nsa-sub" id="nsa-modal-sub"></p>' +
        '<div id="nsa-modal-fields"></div><div class="nsa-error" id="nsa-modal-error"></div>' +
        '<div class="nsa-row"><button class="nsa-btn primary" id="nsa-modal-ok" type="button"></button>' +
        '<button class="nsa-btn ghost" id="nsa-modal-cancel" type="button">' + esc(t("common.cancel")) + '</button></div></div></section>';
  }

  var BAR_HTML =
    '<div class="nsa-session-bar" id="nsa-session-bar"><div class="sb-left">' +
      '<span class="sb-room" id="nsa-sb-room"></span><span class="sb-name" id="nsa-sb-name"></span>' +
      '<span class="nsa-lock" id="nsa-sb-lock"></span><span class="sb-count" id="nsa-sb-count"></span></div>' +
    '<div class="sb-right"><div class="nsa-user"><b id="nsa-sb-user">—</b><span id="nsa-sb-langs"></span></div>' +
      '<button id="nsa-sb-sessions" type="button"></button><button id="nsa-sb-signout" type="button"></button></div></div>';

  var host = null;

  function mountScreens() {
    if (host && host.parentNode) host.parentNode.removeChild(host);
    host = document.createElement("div");
    host.id = "nsa-screens";
    host.innerHTML = screensHTML();
    bridge.appendChild(host);
    renderLangChips();
    bindScreenEvents();
    setAuthTab(currentTab, true);
  }

  function setScreen(name) {
    document.body.setAttribute("data-nsa", name);
    var bar = $("nsa-session-bar");
    if (bar) bar.style.display = name === "app" ? "flex" : "none";
    if (name !== "app") { var modal = $("nsa-modal"); if (modal) modal.style.display = "none"; }
    if (name === "gate") { var g = $("nsa-gate-code"); if (g) { g.value = ""; g.focus(); } }
  }

  function renderLangChips() {
    var box = $("nsa-langs"); if (!box) return;
    box.innerHTML = "";
    LANGS.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nsa-chip" + (chosenLangs.indexOf(l.id) >= 0 ? " active" : "");
      b.textContent = l.label;
      b.addEventListener("click", function () {
        var at = chosenLangs.indexOf(l.id);
        if (at >= 0) { chosenLangs.splice(at, 1); b.classList.remove("active"); }
        else { chosenLangs.push(l.id); b.classList.add("active"); }
        setErr("nsa-reg-error", "");
      });
      box.appendChild(b);
    });
  }

  function setAuthTab(tab, force) {
    currentTab = tab;
    var rp = $("nsa-register-pane"), sp = $("nsa-signin-pane");
    if (!rp || !sp) return;
    document.querySelectorAll("[data-auth-tab]").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-auth-tab") === tab); });
    rp.style.display = tab === "register" ? "block" : "none";
    sp.style.display = tab === "signin" ? "block" : "none";
    if (!force) { setErr("nsa-reg-error", ""); setErr("nsa-in-error", ""); }
  }

  function clearUnlocks() { unlocked = {}; sset(K.unlock, {}); }

  function register() {
    var name = val("nsa-reg-name").trim(), pass = val("nsa-reg-pass");
    setErr("nsa-reg-error", "");
    if (name.length < 2 || name.length > 24) return setErr("nsa-reg-error", t("err.name"));
    if (pass.length < 4) return setErr("nsa-reg-error", t("err.pass"));
    if (!chosenLangs.length) return setErr("nsa-reg-error", t("err.langs"));
    if (users.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) return setErr("nsa-reg-error", t("err.exists"));
    var user = { id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name, pass: hashPass(name.toLowerCase(), pass), langs: chosenLangs.slice(), createdAt: Date.now() };
    users.push(user); save(K.users, users); clearUnlocks();
    me = user; save(K.current, user.id); chosenLangs = [];
    showRooms();
  }

  function signin() {
    var name = val("nsa-in-name").trim(), pass = val("nsa-in-pass");
    setErr("nsa-in-error", "");
    var user = users.filter(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })[0];
    if (!user) return setErr("nsa-in-error", t("err.nouser"));
    if (user.pass !== hashPass(user.name.toLowerCase(), pass)) return setErr("nsa-in-error", t("err.wrongpass"));
    clearUnlocks(); me = user; save(K.current, user.id);
    showRooms();
  }

  function signOut() {
    clearUnlocks(); me = null; active = null; roomId = null;
    try { localStorage.removeItem(K.current); } catch (e) {}
    setScreen("auth"); setAuthTab("register");
  }

  function renderRooms() {
    var kicker = $("nsa-rooms-kicker");
    if (kicker) kicker.textContent = me ? tr("rooms.signedAs", { name: me.name.toUpperCase() }) : "";
    var list = $("nsa-rooms-list"); if (!list) return;
    list.innerHTML = "";
    ROOMS.forEach(function (r) {
      var count = sessions.filter(function (s) { return s.room === r.id; }).length;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "nsa-room";
      btn.innerHTML = '<span class="ico">' + r.icon + '</span><span class="rm-body"><h4>' + esc(roomLabel(r.id)) +
        '</h4><p>' + esc(roomDesc(r.id)) + '</p></span><span class="rm-count">' + esc(sessionsLabel(count)) + '</span>';
      btn.addEventListener("click", function () { roomId = r.id; showSessions(); });
      list.appendChild(btn);
    });
  }
  function showRooms() {
    if (!me) { setScreen("auth"); setAuthTab("register", true); return; }
    setScreen("rooms"); renderRooms();
  }

  function renderSessions() {
    if (!roomId) return;
    var title = $("nsa-sessions-title");
    if (title) title.textContent = tr("sessions.title", { room: roomLabel(roomId).toUpperCase() });
    var kicker = $("nsa-sessions-kicker");
    if (kicker) kicker.textContent = me ? tr("sessions.signedAs", { name: me.name.toUpperCase() }) : "";
    var list = $("nsa-sessions-list"); if (!list) return;
    list.innerHTML = "";
    var inRoom = sessions.filter(function (s) { return s.room === roomId; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    if (!inRoom.length) { list.innerHTML = '<div class="nsa-empty">' + t("sessions.emptyHtml") + '</div>'; return; }
    inRoom.forEach(function (s) {
      var count = (s.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "nsa-session";
      btn.innerHTML = '<span class="s-body"><span class="s-name">' + esc(s.name) + '</span><span class="s-meta">' +
        esc(tr("sessions.meta", { owner: s.ownerName, date: new Date(s.createdAt).toLocaleString(), msgs: msgsLabel(count) })) +
        '</span></span><span class="nsa-lock">' + t("sessions.lock") + '</span>';
      btn.addEventListener("click", function () { enterSession(s); });
      list.appendChild(btn);
    });
  }
  function showSessions() {
    if (!me) { setScreen("auth"); setAuthTab("register", true); return; }
    setScreen("sessions"); renderSessions();
  }

  function enterSession(s) {
    if (unlocked[s.id]) return openSession(s);
    showModal(t("unlock.title"), tr("unlock.sub", { name: s.name }),
      '<label class="nsa-label" for="nsa-unlock-pass">' + esc(t("unlock.label")) + '</label><input class="nsa-input" id="nsa-unlock-pass" type="password" autocomplete="off">',
      t("unlock.ok"), function () {
        var pass = val("nsa-unlock-pass");
        if (hashPass(s.id, pass) !== s.pass) return setErr("nsa-modal-error", t("unlock.err"));
        unlocked[s.id] = true; sset(K.unlock, unlocked); hideModal(); openSession(s);
      });
  }

  function showModal(title, sub, fieldsHTML, okLabel, onOk) {
    $("nsa-modal-title").textContent = title;
    $("nsa-modal-sub").textContent = sub;
    $("nsa-modal-fields").innerHTML = fieldsHTML;
    $("nsa-modal-error").textContent = "";
    $("nsa-modal-ok").textContent = okLabel;
    modalOkHandler = onOk;
    $("nsa-modal").style.display = "flex";
    var first = $("nsa-modal").querySelector("input"); if (first) first.focus();
  }
  function hideModal() { $("nsa-modal").style.display = "none"; }

  function createSession() {
    if (!me) { setScreen("auth"); setAuthTab("register", true); return; }
    showModal(t("create.title"), tr("create.sub", { room: roomLabel(roomId) }),
      '<label class="nsa-label" for="nsa-new-name">' + esc(t("create.name")) + '</label>' +
      '<input class="nsa-input" id="nsa-new-name" maxlength="48" autocomplete="off" placeholder="' + esc(t("create.namePh")) + '">' +
      '<label class="nsa-label" for="nsa-new-pass">' + esc(t("create.pass")) + '</label>' +
      '<input class="nsa-input" id="nsa-new-pass" type="password" autocomplete="new-password" placeholder="' + esc(t("create.passPh")) + '">' +
      '<label class="nsa-label" for="nsa-new-pass2">' + esc(t("create.pass2")) + '</label>' +
      '<input class="nsa-input" id="nsa-new-pass2" type="password" autocomplete="new-password">',
      t("create.ok"), function () {
        var name = val("nsa-new-name").trim() || tr("create.defaultName", { date: new Date().toLocaleString() });
        var p1 = val("nsa-new-pass"), p2 = val("nsa-new-pass2");
        if (p1.length < 4) return setErr("nsa-modal-error", t("create.errPass"));
        if (p1 !== p2) return setErr("nsa-modal-error", t("create.errMatch"));
        var id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var now = Date.now();
        var s = { id: id, room: roomId, name: name, pass: hashPass(id, p1), ownerId: me ? me.id : null, ownerName: me ? me.name : "Guest", createdAt: now,
          messages: [{ kind: "system", text: tr("sys.created", { name: me ? me.name : "Guest", date: new Date(now).toLocaleString() }), ts: now }] };
        sessions.push(s); save(K.sessions, sessions);
        unlocked[s.id] = true; sset(K.unlock, unlocked);
        hideModal(); openSession(s);
      });
  }

  function openSession(s) { active = s; setScreen("app"); renderSession(); }

  function langLabel(id) { var l = LANGS.filter(function (x) { return x.id === id; })[0]; return l ? l.label : id; }

  function updateBar() {
    if (!active) return;
    var room = $("nsa-sb-room"), name = $("nsa-sb-name"), lock = $("nsa-sb-lock");
    if (room) room.textContent = roomLabel(active.room).toUpperCase();
    if (name) name.textContent = active.name;
    if (lock) lock.textContent = t("bar.lock");
    var count = (active.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
    var cEl = $("nsa-sb-count"); if (cEl) cEl.textContent = tr("bar.count", { n: count });
    var sBtn = $("nsa-sb-sessions"); if (sBtn) sBtn.textContent = t("bar.sessions");
    var oBtn = $("nsa-sb-signout"); if (oBtn) oBtn.textContent = t("bar.signout");
    var userEl = $("nsa-sb-user"), langsEl = $("nsa-sb-langs");
    if (userEl) userEl.textContent = me ? me.name : "Guest";
    if (langsEl) langsEl.textContent = me ? me.langs.map(langLabel).join(" \u00b7 ") : "";
    var st = $("subtitle"); if (st) st.textContent = active.name + " \u00b7 " + msgsLabel(count);
  }

  function renderSession() {
    if (!active) return;
    replaying = true;
    messagesEl.innerHTML = "";
    (active.messages || []).forEach(function (m) { messagesEl.appendChild(buildMessage(m)); });
    replaying = false;
    updateBar();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildMessage(m) {
    if (m.kind === "system") {
      var sys = document.createElement("div"); sys.className = "nsa-sys"; sys.textContent = m.text; return sys;
    }
    var node = document.createElement("div");
    node.className = "msg" + (m.mine ? " me" : "");
    node.dataset.sender = m.senderId; node.dataset.en = m.text; node.dataset.ru = m.text;
    node.dataset.nameEn = m.nameEn; node.dataset.nameRu = m.nameRu || m.nameEn;
    node.dataset.roleEn = m.roleEn; node.dataset.roleRu = m.roleRu || m.roleEn;
    var av = document.createElement("i");
    av.className = "avatar"; av.textContent = m.short || "?";
    av.style.background = m.color || "#00f0ff";
    av.style.color = (m.color === "#bd00ff" || m.color === "#ff0055") ? "#ffffff" : "#03080e";
    av.style.boxShadow = "0 0 12px " + (m.color || "#00f0ff") + "66";
    var wrap = document.createElement("div"); wrap.className = "bubble-wrap";
    var meta = document.createElement("div"); meta.className = "msg-meta";
    meta.innerHTML = '<span class="msg-name">' + esc(m.nameEn) + '</span>' +
      '<span class="msg-role-badge" style="background:' + esc(m.color || "#00f0ff") + '22;color:' + esc(m.color || "#00f0ff") + ';">' + esc(m.roleEn) + '</span>' +
      '<span class="msg-time">\u00b7 ' + esc(m.time) + '</span>';
    var bubble = document.createElement("div"); bubble.className = "bubble";
    var txt = document.createElement("span"); txt.className = "bubble-text"; txt.textContent = m.text;
    var trEl = document.createElement("span"); trEl.className = "tr hidden-translation"; trEl.textContent = "";
    bubble.appendChild(txt); bubble.appendChild(trEl);
    wrap.appendChild(meta); wrap.appendChild(bubble);
    node.appendChild(av); node.appendChild(wrap);
    return node;
  }

  function nodeToMessage(node) {
    var avatar = node.querySelector(".avatar");
    var nameEl = node.querySelector(".msg-name");
    var roleEl = node.querySelector(".msg-role-badge");
    var timeEl = node.querySelector(".msg-time");
    var textEl = node.querySelector(".bubble-text");
    var color = avatar && avatar.style.background ? toHex(avatar.style.background) : "#00f0ff";
    return {
      kind: "chat", senderId: node.dataset.sender || "guest",
      text: textEl ? textEl.textContent : "",
      nameEn: node.dataset.nameEn || (nameEl ? nameEl.textContent : "Guest"),
      nameRu: node.dataset.nameRu || node.dataset.nameEn || "",
      roleEn: node.dataset.roleEn || (roleEl ? roleEl.textContent : "Participant"),
      roleRu: node.dataset.roleRu || "",
      mine: node.classList.contains("me"),
      short: avatar ? avatar.textContent : "?",
      color: color,
      time: timeEl ? timeEl.textContent.replace(/\u00b7/g, "").trim() : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ts: Date.now(), authorId: me ? me.id : null, authorName: me ? me.name : null
    };
  }

  function syncFromDom() {
    if (!active || replaying) return;
    var nodes = messagesEl.querySelectorAll(".msg");
    var stored = (active.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
    if (nodes.length <= stored) return;
    for (var i = stored; i < nodes.length; i++) active.messages.push(nodeToMessage(nodes[i]));
    save(K.sessions, sessions);
    updateBar();
  }

  function syncDealRoomLang() {
    var sel = $("lang"); if (!sel) return;
    var want = LANG === "ru" ? "Русский" : "English";
    if (sel.value === want) return;
    syncingLang = true; sel.value = want; sel.dispatchEvent(new Event("change")); syncingLang = false;
    if (active) updateBar();
  }

  function setLang(lang) {
    LANG = lang === "ru" ? "ru" : "en";
    save(K.lang, LANG);
    syncDealRoomLang();
    mountScreens();
    var screen = document.body.getAttribute("data-nsa");
    if (screen === "auth") setScreen("auth");
    else if (screen === "rooms") showRooms();
    else if (screen === "sessions") showSessions();
    else if (screen === "app") updateBar();
    else if (screen === "gate") setScreen("gate");
    else setScreen("gate");
  }

  function bindScreenEvents() {
    var gateBtn = $("nsa-gate-btn");
    if (gateBtn) gateBtn.addEventListener("click", function () {
      if (val("nsa-gate-code") !== ACCESS_CODE) return setErr("nsa-gate-error", t("gate.err"));
      sset(K.gate, true);
      if (me) showRooms(); else { setScreen("auth"); setAuthTab("register"); }
    });
    var gateInput = $("nsa-gate-code");
    if (gateInput) gateInput.addEventListener("keydown", function (e) { if (e.key === "Enter") $("nsa-gate-btn").click(); });
    document.querySelectorAll("[data-auth-tab]").forEach(function (b) {
      b.addEventListener("click", function () { setAuthTab(b.getAttribute("data-auth-tab")); });
    });
    document.querySelectorAll("#nsa-lang-switch [data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { if (b.getAttribute("data-lang") !== LANG) setLang(b.getAttribute("data-lang")); });
    });
    var regBtn = $("nsa-reg-btn"); if (regBtn) regBtn.addEventListener("click", register);
    var inBtn = $("nsa-in-btn"); if (inBtn) inBtn.addEventListener("click", signin);
    var regPass = $("nsa-reg-pass"); if (regPass) regPass.addEventListener("keydown", function (e) { if (e.key === "Enter") register(); });
    var inPass = $("nsa-in-pass"); if (inPass) inPass.addEventListener("keydown", function (e) { if (e.key === "Enter") signin(); });
    var roomsOut = $("nsa-rooms-signout"); if (roomsOut) roomsOut.addEventListener("click", signOut);
    var sessionsBack = $("nsa-sessions-back"); if (sessionsBack) sessionsBack.addEventListener("click", showRooms);
    var sessionsOut = $("nsa-sessions-signout"); if (sessionsOut) sessionsOut.addEventListener("click", signOut);
    var newSession = $("nsa-new-session"); if (newSession) newSession.addEventListener("click", createSession);
    var modalOk = $("nsa-modal-ok"); if (modalOk) modalOk.addEventListener("click", function () { if (modalOkHandler) modalOkHandler(); });
    var modalCancel = $("nsa-modal-cancel"); if (modalCancel) modalCancel.addEventListener("click", hideModal);
  }

  function bindStaticEvents() {
    $("nsa-sb-sessions").addEventListener("click", showSessions);
    $("nsa-sb-signout").addEventListener("click", signOut);
    var sel = $("lang");
    if (sel) sel.addEventListener("change", function () {
      if (syncingLang) return;
      var lang = sel.value === "Русский" ? "ru" : "en";
      if (lang !== LANG) setLang(lang);
    });
    var observer = new MutationObserver(function () {
      if (replaying || !active) return;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(syncFromDom, 80);
    });
    observer.observe(messagesEl, { childList: true });
    $("nsa-sb-lock").textContent = t("bar.lock");
    $("nsa-sb-sessions").textContent = t("bar.sessions");
    $("nsa-sb-signout").textContent = t("bar.signout");
  }

  function boot() {
    var grid = bridge.querySelector(".grid");
    var bar = document.createElement("div");
    bar.innerHTML = BAR_HTML;
    if (grid && grid.parentNode) grid.parentNode.insertBefore(bar.firstElementChild, grid);

    mountScreens();
    bindStaticEvents();

    var savedId = load(K.current, null);
    if (savedId) { var found = users.filter(function (u) { return u.id === savedId; })[0]; if (found) me = found; }

    syncDealRoomLang();

    if (!sget(K.gate, false)) setScreen("gate");
    else if (!me) { setScreen("auth"); setAuthTab(currentTab, true); }
    else showRooms();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
