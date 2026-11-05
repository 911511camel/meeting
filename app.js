(function () {
  "use strict";

  /* ============================================================
     NIKOLAS SEGURADO · Bilingual Bridge access layer
     gate -> register / sign-in -> room -> session (1x password)
     All data lives in localStorage; nothing leaves the browser.
     ============================================================ */

  var ACCESS_CODE = "NIKOLAS-2077";

  var K = {
    users: "nsa.v1.users",
    current: "nsa.v1.current",
    sessions: "nsa.v1.sessions",
    unlock: "nsa.v1.unlock",
    gate: "nsa.v1.gate"
  };

  var ROOMS = [
    { id: "Crypto", icon: "\u2311", label: "Crypto", desc: "buyer \u2194 seller \u00b7 OTC & escrow" },
    { id: "Bank protocols", icon: "\u25a3", label: "Bank protocols", desc: "private bank-protocol negotiation" }
  ];

  var LANGS = [
    { id: "en", label: "English" },
    { id: "ru", label: "Русский" },
    { id: "es", label: "Español" },
    { id: "tl", label: "Tagalog" },
    { id: "zh", label: "中文" },
    { id: "ar", label: "العربية" },
    { id: "fr", label: "Français" },
    { id: "de", label: "Deutsch" }
  ];

  /* ---------- storage ---------- */
  function load(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn("nsa storage", e); }
  }
  function sget(key, fallback) {
    try { var raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function sset(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------- password hashing (local, non-cryptographic demo) ---------- */
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

  /* ---------- state ---------- */
  var users = load(K.users, []);
  var sessions = load(K.sessions, []);
  var unlocked = sget(K.unlock, {});
  var me = null;
  var roomId = null;
  var active = null;
  var chosenLangs = [];
  var replaying = false;
  var syncTimer = null;

  /* ---------- dom helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function val(id) { var el = $(id); return el ? el.value : ""; }
  function toHex(c) {
    if (!c) return "#00f0ff";
    if (c.charAt(0) === "#") return c;
    var m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return "#00f0ff";
    return "#" + m[1].split(",").slice(0, 3).map(function (n) {
      var v = ("0" + parseInt(n, 10).toString(16)).slice(-2);
      return v.length > 2 ? v.slice(-2) : v;
    }).join("");
  }
  function setErr(id, msg) { var el = $(id); if (el) el.textContent = msg || ""; }

  var bridge = $("bridge");
  var messagesEl = $("messages");

  /* ---------- screens markup ---------- */
  var SCREENS =
    '<section class="nsa-screen" id="nsa-gate">' +
      '<div class="nsa-card">' +
        '<div class="nsa-kicker">NIKOLAS SEGURADO — STARTUP PROJECT</div>' +
        '<h2 class="nsa-title">BILINGUAL BRIDGE</h2>' +
        '<p class="nsa-sub">Password protected terminal. Enter the access code to open the identity layer.</p>' +
        '<label class="nsa-label" for="nsa-gate-code">Access code</label>' +
        '<input class="nsa-input" id="nsa-gate-code" type="password" autocomplete="off" placeholder="access code">' +
        '<div class="nsa-error" id="nsa-gate-error"></div>' +
        '<button class="nsa-btn primary" id="nsa-gate-btn" type="button">UNLOCK TERMINAL</button>' +
        '<p class="nsa-hint">Default code: <code>NIKOLAS-2077</code> — change <code>ACCESS_CODE</code> in app.js</p>' +
      '</div>' +
    '</section>' +

    '<section class="nsa-screen" id="nsa-auth">' +
      '<div class="nsa-card">' +
        '<div class="nsa-kicker">IDENTITY LAYER</div>' +
        '<h2 class="nsa-title">DEAL ROOM ACCESS</h2>' +
        '<p class="nsa-sub">Register with your name, a password and the languages you speak. Existing members can sign in.</p>' +
        '<div class="nsa-tabs">' +
          '<button class="nsa-tab active" type="button" data-auth-tab="register">REGISTER</button>' +
          '<button class="nsa-tab" type="button" data-auth-tab="signin">SIGN IN</button>' +
        '</div>' +
        '<div id="nsa-register-pane">' +
          '<label class="nsa-label" for="nsa-reg-name">Name</label>' +
          '<input class="nsa-input" id="nsa-reg-name" maxlength="24" autocomplete="off" placeholder="Nikolas Segurado">' +
          '<label class="nsa-label" for="nsa-reg-pass">Password</label>' +
          '<input class="nsa-input" id="nsa-reg-pass" type="password" autocomplete="new-password" placeholder="min. 4 characters">' +
          '<label class="nsa-label">Languages you speak</label>' +
          '<div class="nsa-chips" id="nsa-langs"></div>' +
          '<div class="nsa-error" id="nsa-reg-error"></div>' +
          '<button class="nsa-btn primary" id="nsa-reg-btn" type="button">CREATE ACCOUNT</button>' +
        '</div>' +
        '<div id="nsa-signin-pane" style="display:none">' +
          '<label class="nsa-label" for="nsa-in-name">Name</label>' +
          '<input class="nsa-input" id="nsa-in-name" maxlength="24" autocomplete="off">' +
          '<label class="nsa-label" for="nsa-in-pass">Password</label>' +
          '<input class="nsa-input" id="nsa-in-pass" type="password" autocomplete="current-password">' +
          '<div class="nsa-error" id="nsa-in-error"></div>' +
          '<button class="nsa-btn primary" id="nsa-in-btn" type="button">ENTER DEAL ROOMS</button>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="nsa-screen" id="nsa-rooms">' +
      '<div class="nsa-card">' +
        '<div class="nsa-kicker" id="nsa-rooms-kicker">SIGNED IN</div>' +
        '<h2 class="nsa-title">CHOOSE ROOM</h2>' +
        '<p class="nsa-sub">Rooms hold sessions. Every session is password protected on creation.</p>' +
        '<div id="nsa-rooms-list"></div>' +
        '<div class="nsa-row" style="margin-top:16px">' +
          '<button class="nsa-btn ghost" id="nsa-rooms-signout" type="button">SIGN OUT</button>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="nsa-screen" id="nsa-sessions">' +
      '<div class="nsa-card">' +
        '<button class="nsa-back" id="nsa-sessions-back" type="button">\u2190 ROOMS</button>' +
        '<div class="nsa-kicker" id="nsa-sessions-kicker">ROOM</div>' +
        '<h2 class="nsa-title" id="nsa-sessions-title">SESSIONS</h2>' +
        '<p class="nsa-sub">Join an existing session or create a new one. A session password is asked once per browser tab.</p>' +
        '<div class="nsa-list" id="nsa-sessions-list"></div>' +
        '<button class="nsa-btn primary" id="nsa-new-session" type="button">+ NEW SESSION</button>' +
        '<div class="nsa-row" style="margin-top:10px">' +
          '<button class="nsa-btn ghost" id="nsa-sessions-signout" type="button">SIGN OUT</button>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="nsa-screen" id="nsa-modal">' +
      '<div class="nsa-card" style="max-width:440px">' +
        '<h2 class="nsa-title" id="nsa-modal-title">UNLOCK SESSION</h2>' +
        '<p class="nsa-sub" id="nsa-modal-sub"></p>' +
        '<div id="nsa-modal-fields"></div>' +
        '<div class="nsa-error" id="nsa-modal-error"></div>' +
        '<div class="nsa-row">' +
          '<button class="nsa-btn primary" id="nsa-modal-ok" type="button">UNLOCK</button>' +
          '<button class="nsa-btn ghost" id="nsa-modal-cancel" type="button">CANCEL</button>' +
        '</div>' +
      '</div>' +
    '</section>';

  var BAR_HTML =
    '<div class="nsa-session-bar" id="nsa-session-bar">' +
      '<div class="sb-left">' +
        '<span class="sb-room" id="nsa-sb-room">ROOM</span>' +
        '<span class="sb-name" id="nsa-sb-name">session</span>' +
        '<span class="nsa-lock" id="nsa-sb-lock">PASSWORD \u00b7 UNLOCKED</span>' +
        '<span class="sb-count" id="nsa-sb-count">0 messages</span>' +
      '</div>' +
      '<div class="sb-right">' +
        '<div class="nsa-user"><b id="nsa-sb-user">—</b><span id="nsa-sb-langs"></span></div>' +
        '<button id="nsa-sb-sessions" type="button">SESSIONS</button>' +
        '<button id="nsa-sb-signout" type="button">SIGN OUT</button>' +
      '</div>' +
    '</div>';

  /* ---------- screen switching ---------- */
  function setScreen(name) {
    document.body.setAttribute("data-nsa", name);
    var bar = $("nsa-session-bar");
    if (bar) bar.style.display = name === "app" ? "flex" : "none";
    if (name !== "app") { var modal = $("nsa-modal"); if (modal) modal.style.display = "none"; }
    if (name === "gate") { var g = $("nsa-gate-code"); if (g) { g.value = ""; g.focus(); } }
  }

  /* ---------- auth ---------- */
  function renderLangChips() {
    var box = $("nsa-langs");
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

  function setAuthTab(tab) {
    if (tab === "register") renderLangChips();
    document.querySelectorAll("[data-auth-tab]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-auth-tab") === tab);
    });
    $("nsa-register-pane").style.display = tab === "register" ? "block" : "none";
    $("nsa-signin-pane").style.display = tab === "signin" ? "block" : "none";
    setErr("nsa-reg-error", "");
    setErr("nsa-in-error", "");
  }

  function clearUnlocks() { unlocked = {}; sset(K.unlock, {}); }

  function register() {
    var name = val("nsa-reg-name").trim();
    var pass = val("nsa-reg-pass");
    setErr("nsa-reg-error", "");
    if (name.length < 2 || name.length > 24) return setErr("nsa-reg-error", "Name must be 2-24 characters.");
    if (pass.length < 4) return setErr("nsa-reg-error", "Password must be at least 4 characters.");
    if (!chosenLangs.length) return setErr("nsa-reg-error", "Pick at least one language you speak.");
    if (users.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) {
      return setErr("nsa-reg-error", "That name is already registered. Sign in instead.");
    }
    var user = {
      id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      pass: hashPass(name.toLowerCase(), pass),
      langs: chosenLangs.slice(),
      createdAt: Date.now()
    };
    users.push(user);
    save(K.users, users);
    clearUnlocks();
    me = user;
    save(K.current, user.id);
    chosenLangs = [];
    showRooms();
  }

  function signin() {
    var name = val("nsa-in-name").trim();
    var pass = val("nsa-in-pass");
    setErr("nsa-in-error", "");
    var user = users.filter(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })[0];
    if (!user) return setErr("nsa-in-error", "No account with that name.");
    if (user.pass !== hashPass(user.name.toLowerCase(), pass)) return setErr("nsa-in-error", "Wrong password.");
    clearUnlocks();
    me = user;
    save(K.current, user.id);
    showRooms();
  }

  function signOut() {
    clearUnlocks();
    me = null; active = null; roomId = null;
    try { localStorage.removeItem(K.current); } catch (e) {}
    setScreen("auth");
    setAuthTab("signin");
  }

  /* ---------- rooms ---------- */
  function showRooms() {
    setScreen("rooms");
    var kicker = $("nsa-rooms-kicker");
    if (kicker) kicker.textContent = "SIGNED IN AS " + (me ? me.name.toUpperCase() : "GUEST");
    var list = $("nsa-rooms-list");
    list.innerHTML = "";
    ROOMS.forEach(function (r) {
      var count = sessions.filter(function (s) { return s.room === r.id; }).length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nsa-room";
      btn.innerHTML =
        '<span class="ico">' + r.icon + '</span>' +
        '<span class="rm-body"><h4>' + esc(r.label) + '</h4><p>' + esc(r.desc) + '</p></span>' +
        '<span class="rm-count">' + count + ' session' + (count === 1 ? "" : "s") + '</span>';
      btn.addEventListener("click", function () { roomId = r.id; showSessions(); });
      list.appendChild(btn);
    });
  }

  /* ---------- sessions ---------- */
  function showSessions() {
    setScreen("sessions");
    $("nsa-sessions-title").textContent = roomId.toUpperCase() + " \u00b7 SESSIONS";
    $("nsa-sessions-kicker").textContent = me ? "SIGNED IN AS " + me.name.toUpperCase() : "ROOM";
    var list = $("nsa-sessions-list");
    list.innerHTML = "";
    var inRoom = sessions.filter(function (s) { return s.room === roomId; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
    if (!inRoom.length) {
      list.innerHTML = '<div class="nsa-empty">No sessions in this room yet.<br>Create the first one \u2014 it will be password protected.</div>';
      return;
    }
    inRoom.forEach(function (s) {
      var count = (s.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nsa-session";
      btn.innerHTML =
        '<span class="s-body"><span class="s-name">' + esc(s.name) + '</span>' +
        '<span class="s-meta">by ' + esc(s.ownerName) + ' \u00b7 ' + new Date(s.createdAt).toLocaleString() + ' \u00b7 ' + count + ' message' + (count === 1 ? "" : "s") + '</span></span>' +
        '<span class="nsa-lock">\u{1F512} LOCKED</span>';
      btn.addEventListener("click", function () { enterSession(s); });
      list.appendChild(btn);
    });
  }

  function enterSession(s) {
    if (unlocked[s.id]) return openSession(s);
    showModal(
      "UNLOCK SESSION",
      s.name + " \u2014 protected by password. Asked once per browser tab.",
      '<label class="nsa-label" for="nsa-unlock-pass">Session password</label>' +
      '<input class="nsa-input" id="nsa-unlock-pass" type="password" autocomplete="off">',
      "UNLOCK",
      function () {
        var pass = val("nsa-unlock-pass");
        if (hashPass(s.id, pass) !== s.pass) return setErr("nsa-modal-error", "Wrong session password.");
        unlocked[s.id] = true;
        sset(K.unlock, unlocked);
        hideModal();
        openSession(s);
      }
    );
  }

  function showModal(title, sub, fieldsHTML, okLabel, onOk) {
    $("nsa-modal-title").textContent = title;
    $("nsa-modal-sub").textContent = sub;
    $("nsa-modal-fields").innerHTML = fieldsHTML;
    setErr("nsa-modal-error", "");
    var ok = $("nsa-modal-ok");
    ok.textContent = okLabel;
    ok.onclick = function () { onOk(); };
    $("nsa-modal-cancel").onclick = hideModal;
    $("nsa-modal").style.display = "flex";
    var first = $("nsa-modal").querySelector("input");
    if (first) first.focus();
  }

  function hideModal() { $("nsa-modal").style.display = "none"; }

  function createSession() {
    showModal(
      "NEW SESSION",
      "Room: " + roomId + ". The password is entered once per tab when someone opens this session.",
      '<label class="nsa-label" for="nsa-new-name">Session name</label>' +
      '<input class="nsa-input" id="nsa-new-name" maxlength="48" autocomplete="off" placeholder="e.g. 2 BTC OTC \u2014 test tranche">' +
      '<label class="nsa-label" for="nsa-new-pass">Session password</label>' +
      '<input class="nsa-input" id="nsa-new-pass" type="password" autocomplete="new-password" placeholder="min. 4 characters">' +
      '<label class="nsa-label" for="nsa-new-pass2">Repeat password</label>' +
      '<input class="nsa-input" id="nsa-new-pass2" type="password" autocomplete="new-password">',
      "CREATE SESSION",
      function () {
        var name = val("nsa-new-name").trim() || ("Deal " + new Date().toLocaleString());
        var p1 = val("nsa-new-pass");
        var p2 = val("nsa-new-pass2");
        if (p1.length < 4) return setErr("nsa-modal-error", "Password must be at least 4 characters.");
        if (p1 !== p2) return setErr("nsa-modal-error", "Passwords do not match.");
        var id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var now = Date.now();
        var s = {
          id: id,
          room: roomId,
          name: name,
          pass: hashPass(id, p1),
          ownerId: me ? me.id : null,
          ownerName: me ? me.name : "Guest",
          createdAt: now,
          messages: [{
            kind: "system",
            text: "Session created by " + (me ? me.name : "Guest") + " \u00b7 " + new Date(now).toLocaleString() + " \u00b7 password protected",
            ts: now
          }]
        };
        sessions.push(s);
        save(K.sessions, sessions);
        unlocked[s.id] = true;
        sset(K.unlock, unlocked);
        hideModal();
        openSession(s);
      }
    );
  }

  /* ---------- session view ---------- */
  function openSession(s) {
    active = s;
    setScreen("app");
    $("nsa-sb-room").textContent = s.room;
    $("nsa-sb-name").textContent = s.name;
    $("nsa-sb-lock").textContent = "PASSWORD \u00b7 UNLOCKED";
    $("nsa-sb-user").textContent = me ? me.name : "Guest";
    $("nsa-sb-langs").textContent = me ? me.langs.map(langLabel).join(" \u00b7 ") : "";
    var rn = $("roomname");
    var st = $("subtitle");
    if (rn) rn.textContent = s.room;
    if (st) st.textContent = s.name;
    renderSession();
  }

  function langLabel(id) {
    var l = LANGS.filter(function (x) { return x.id === id; })[0];
    return l ? l.label : id;
  }

  function renderSession() {
    if (!active) return;
    replaying = true;
    messagesEl.innerHTML = "";
    (active.messages || []).forEach(function (m) {
      messagesEl.appendChild(buildMessage(m));
    });
    replaying = false;
    updateBar();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildMessage(m) {
    if (m.kind === "system") {
      var sys = document.createElement("div");
      sys.className = "nsa-sys";
      sys.textContent = m.text;
      return sys;
    }
    var node = document.createElement("div");
    node.className = "msg" + (m.mine ? " me" : "");
    node.dataset.sender = m.senderId;
    node.dataset.en = m.text;
    node.dataset.ru = m.text;
    node.dataset.nameEn = m.nameEn;
    node.dataset.nameRu = m.nameRu || m.nameEn;
    node.dataset.roleEn = m.roleEn;
    node.dataset.roleRu = m.roleRu || m.roleEn;

    var av = document.createElement("i");
    av.className = "avatar";
    av.textContent = m.short || "?";
    av.style.background = m.color || "#00f0ff";
    av.style.color = (m.color === "#bd00ff" || m.color === "#ff0055") ? "#ffffff" : "#03080e";
    av.style.boxShadow = "0 0 12px " + (m.color || "#00f0ff") + "66";

    var wrap = document.createElement("div");
    wrap.className = "bubble-wrap";
    var meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.innerHTML =
      '<span class="msg-name">' + esc(m.nameEn) + '</span>' +
      '<span class="msg-role-badge" style="background:' + esc(m.color || "#00f0ff") + '22;color:' + esc(m.color || "#00f0ff") + ';">' + esc(m.roleEn) + '</span>' +
      '<span class="msg-time">\u00b7 ' + esc(m.time) + '</span>';
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    var txt = document.createElement("span");
    txt.className = "bubble-text";
    txt.textContent = m.text;
    var tr = document.createElement("span");
    tr.className = "tr hidden-translation";
    tr.textContent = "";
    bubble.appendChild(txt);
    bubble.appendChild(tr);
    wrap.appendChild(meta);
    wrap.appendChild(bubble);

    node.appendChild(av);
    node.appendChild(wrap);
    return node;
  }

  function updateBar() {
    if (!active) return;
    var count = (active.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
    var el = $("nsa-sb-count");
    if (el) el.textContent = count + " message" + (count === 1 ? "" : "s") + " in history";
    var st = $("subtitle");
    if (st) st.textContent = active.name + " \u00b7 " + count + " messages";
  }

  function nodeToMessage(node) {
    var avatar = node.querySelector(".avatar");
    var nameEl = node.querySelector(".msg-name");
    var roleEl = node.querySelector(".msg-role-badge");
    var timeEl = node.querySelector(".msg-time");
    var textEl = node.querySelector(".bubble-text");
    var color = avatar && avatar.style.background ? toHex(avatar.style.background) : "#00f0ff";
    return {
      kind: "chat",
      senderId: node.dataset.sender || "guest",
      text: textEl ? textEl.textContent : "",
      nameEn: node.dataset.nameEn || (nameEl ? nameEl.textContent : "Guest"),
      nameRu: node.dataset.nameRu || node.dataset.nameEn || "",
      roleEn: node.dataset.roleEn || (roleEl ? roleEl.textContent : "Participant"),
      roleRu: node.dataset.roleRu || "",
      mine: node.classList.contains("me"),
      short: avatar ? avatar.textContent : "?",
      color: color,
      time: timeEl ? timeEl.textContent.replace(/\u00b7/g, "").trim() : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ts: Date.now(),
      authorId: me ? me.id : null,
      authorName: me ? me.name : null
    };
  }

  function syncFromDom() {
    if (!active || replaying) return;
    var nodes = messagesEl.querySelectorAll(".msg");
    var stored = (active.messages || []).filter(function (m) { return m.kind !== "system"; }).length;
    if (nodes.length <= stored) return;
    for (var i = stored; i < nodes.length; i++) {
      active.messages.push(nodeToMessage(nodes[i]));
    }
    save(K.sessions, sessions);
    updateBar();
  }

  /* ---------- wiring ---------- */
  function bind() {
    $("nsa-gate-btn").addEventListener("click", function () {
      var code = val("nsa-gate-code");
      if (code !== ACCESS_CODE) return setErr("nsa-gate-error", "Invalid access code.");
      sset(K.gate, true);
      if (me) showRooms(); else { setScreen("auth"); setAuthTab("register"); }
    });
    $("nsa-gate-code").addEventListener("keydown", function (e) { if (e.key === "Enter") $("nsa-gate-btn").click(); });

    document.querySelectorAll("[data-auth-tab]").forEach(function (b) {
      b.addEventListener("click", function () { setAuthTab(b.getAttribute("data-auth-tab")); });
    });
    $("nsa-reg-btn").addEventListener("click", register);
    $("nsa-in-btn").addEventListener("click", signin);
    $("nsa-reg-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") register(); });
    $("nsa-in-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") signin(); });

    $("nsa-rooms-signout").addEventListener("click", signOut);
    $("nsa-sessions-back").addEventListener("click", showRooms);
    $("nsa-sessions-signout").addEventListener("click", signOut);
    $("nsa-new-session").addEventListener("click", createSession);

    $("nsa-sb-sessions").addEventListener("click", function () { showSessions(); });
    $("nsa-sb-signout").addEventListener("click", signOut);

    var observer = new MutationObserver(function () {
      if (replaying || !active) return;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(syncFromDom, 80);
    });
    observer.observe(messagesEl, { childList: true });
  }

  /* ---------- boot ---------- */
  function boot() {
    bridge.insertAdjacentHTML("beforeend", SCREENS);
    var grid = bridge.querySelector(".grid");
    if (grid && grid.parentNode) grid.parentNode.insertBefore(
      document.createRange().createContextualFragment(BAR_HTML), grid
    );

    var savedId = load(K.current, null);
    if (savedId) {
      var found = users.filter(function (u) { return u.id === savedId; })[0];
      if (found) me = found;
    }
    renderLangChips();
    bind();

    if (!sget(K.gate, false)) setScreen("gate");
    else if (!me) { setScreen("auth"); setAuthTab("register"); }
    else showRooms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
