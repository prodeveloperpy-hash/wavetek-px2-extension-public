const $ = (id) => document.getElementById(id);
const configIds = ["mockMode", "baseUrl", "authType", "connectionPath", "loginPath", "readPath", "writePath", "writeMethod", "bodyFormat", "settingName"];

document.addEventListener("DOMContentLoaded", async () => {
  const saved = await chrome.storage.local.get("px2Config");
  if (saved.px2Config) applyConfig(saved.px2Config);
  $("connect").addEventListener("click", connect);
  $("read").addEventListener("click", readSetting);
  $("write").addEventListener("click", writeSetting);
  configIds.forEach((id) => $(id).addEventListener("change", saveConfig));
});

function getConfig() {
  return Object.fromEntries(configIds.map((id) => [id, $(id).type === "checkbox" ? $(id).checked : $(id).value]));
}
function applyConfig(config) {
  for (const [id, value] of Object.entries(config)) if ($(id)) $(id).type === "checkbox" ? $(id).checked = value : $(id).value = value;
}
function saveConfig() { chrome.storage.local.set({ px2Config: getConfig() }); }
function show(target, message, state = "") { target.textContent = message; target.className = `result ${state}`; }
function cleanBase(url) { return url.trim().replace(/\/$/, ""); }
function pathFor(template, name) { return template.replace("{name}", encodeURIComponent(name)); }
function urlFor(path) { return `${cleanBase($("baseUrl").value)}${path.startsWith("/") ? path : `/${path}`}`; }

async function requestHostPermission() {
  const url = new URL(cleanBase($("baseUrl").value));
  const origin = `${url.protocol}//${url.host}/*`;
  return chrome.permissions.request({ origins: [origin] });
}
function headers(extra = {}) {
  const result = { ...extra };
  if ($("authType").value === "basic") result.Authorization = `Basic ${btoa(`${$("username").value}:${$("password").value}`)}`;
  return result;
}
async function send(request) {
  const response = await chrome.runtime.sendMessage({ type: "PX2_REQUEST", request });
  if (!response.ok) throw new Error(response.error);
  return response;
}
async function loginIfNeeded() {
  if ($("authType").value !== "form") return;
  const body = new URLSearchParams({ username: $("username").value, password: $("password").value }).toString();
  const response = await send({ url: urlFor($("loginPath").value), method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (response.status >= 400) throw new Error(`Login failed (HTTP ${response.status}).`);
}

async function connect() {
  show($("connectionResult"), "Testing connection…");
  if ($("mockMode").checked) return finishConnection(true, "Mock PX2 connected successfully.");
  try {
    if (!await requestHostPermission()) throw new Error("Permission to access the PX2 was not granted.");
    await loginIfNeeded();
    const response = await send({ url: urlFor($("connectionPath").value), method: "GET", headers: headers() });
    if (response.status >= 400) throw new Error(`PX2 returned HTTP ${response.status}.`);
    finishConnection(true, `PX2 reachable (HTTP ${response.status}).`);
  } catch (error) { finishConnection(false, error.message); }
}
function finishConnection(ok, message) {
  $("statusDot").className = `dot ${ok ? "ok" : "error"}`;
  show($("connectionResult"), message, ok ? "ok" : "error");
}
async function readSetting() {
  const name = $("settingName").value.trim();
  if (!name) return show($("settingResult"), "Enter a setting name.", "error");
  if ($("mockMode").checked) return show($("settingResult"), `${name} = ${$("settingValue").value} (mock)`, "ok");
  try {
    if (!await requestHostPermission()) throw new Error("PX2 access permission denied.");
    await loginIfNeeded();
    const response = await send({ url: urlFor(pathFor($("readPath").value, name)), method: "GET", headers: headers() });
    if (response.status >= 400) throw new Error(`Read failed (HTTP ${response.status}).`);
    const form = parsePx2Form(response.body);
    if (Object.prototype.hasOwnProperty.call(form, name)) {
      $("settingValue").value = form[name];
      show($("settingResult"), `${name} = ${form[name]}`, "ok");
    } else {
      show($("settingResult"), `Response: ${response.body.slice(0, 300) || "(empty)"}`, "ok");
    }
  } catch (error) { show($("settingResult"), error.message, "error"); }
}
async function writeSetting() {
  const name = $("settingName").value.trim(), value = $("settingValue").value;
  if (!name) return show($("settingResult"), "Enter a setting name.", "error");
  if ($("mockMode").checked) return show($("settingResult"), `${name} changed to “${value}” (mock).`, "ok");
  try {
    if (!await requestHostPermission()) throw new Error("PX2 access permission denied.");
    await loginIfNeeded();
    const format = $("bodyFormat").value;
    let request;
    if (format === "multipart") {
      const current = await send({ url: urlFor(pathFor($("readPath").value, name)), method: "GET", headers: headers() });
      if (current.status >= 400) throw new Error(`Unable to load current settings (HTTP ${current.status}).`);
      const formData = parsePx2Form(current.body);
      if (!Object.prototype.hasOwnProperty.call(formData, name)) throw new Error(`PX2 form field “${name}” was not found.`);
      formData[name] = value;
      formData.submit = formData.submit || "1";
      formData.action = formData.action || "Save Changes";
      request = { url: urlFor(pathFor($("writePath").value, name)), method: $("writeMethod").value, headers: headers(), formData };
    } else {
      const json = format === "json";
      const body = json ? JSON.stringify({ name, value }) : new URLSearchParams({ [name]: value }).toString();
      request = { url: urlFor(pathFor($("writePath").value, name)), method: $("writeMethod").value, headers: headers({ "Content-Type": json ? "application/json" : "application/x-www-form-urlencoded" }), body };
    }
    const response = await send(request);
    if (response.status >= 400) throw new Error(`Update failed (HTTP ${response.status}).`);
    show($("settingResult"), `Setting applied (HTTP ${response.status}).`, "ok");
  } catch (error) { show($("settingResult"), error.message, "error"); }
}

function parsePx2Form(html) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const fields = {};
  for (const element of document.querySelectorAll("input[name], select[name], textarea[name], button[name]")) {
    if (["checkbox", "radio"].includes(element.type) && !element.checked) continue;
    if (["submit", "button"].includes(element.type) && !element.value) continue;
    fields[element.name] = element.value;
  }
  return fields;
}
