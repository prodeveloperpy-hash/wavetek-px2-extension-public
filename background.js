const DEFAULT_TIMEOUT_MS = 10000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PX2_REQUEST") return false;
  performRequest(message.request)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch(async (directError) => {
      try {
        const result = await performRequestInPx2Tab(message.request);
        sendResponse({ ok: true, transport: "px2-tab", ...result });
      } catch (tabError) {
        sendResponse({
          ok: false,
          error: `${directError.message} Open and log in to the PX2 WebUI tab, then retry. (${tabError.message})`
        });
      }
    });
  return true;
});

async function performRequest(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(request.url, {
      method: request.method || "GET",
      headers: request.headers || {},
      body: ["GET", "HEAD"].includes(request.method) ? undefined : buildRequestBody(request),
      credentials: request.credentials || "include",
      redirect: "follow",
      signal: controller.signal
    });
    const text = await response.text();
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text.slice(0, 20000)
    };
  } catch (error) {
    if (error.name === "AbortError") throw new Error("PX2 request timed out.");
    throw new Error(error.message || "PX2 request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequestBody(request) {
  if (request.formData) {
    const data = new FormData();
    for (const [key, value] of Object.entries(request.formData)) data.append(key, value);
    return data;
  }
  return request.body;
}

async function performRequestInPx2Tab(request) {
  const origin = new URL(request.url).origin;
  const tabs = await chrome.tabs.query({ url: `${origin}/*` });
  if (!tabs.length) throw new Error("No open PX2 tab was found");

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    world: "MAIN",
    func: async (input) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), input.timeoutMs || 10000);
      try {
        let body = input.body;
        if (input.formData) {
          body = new FormData();
          for (const [key, value] of Object.entries(input.formData)) body.append(key, value);
        }
        const response = await fetch(input.url, {
          method: input.method || "GET",
          headers: input.headers || {},
          body: ["GET", "HEAD"].includes(input.method) ? undefined : body,
          credentials: "include",
          redirect: "follow",
          signal: controller.signal
        });
        const body = await response.text();
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: body.slice(0, 20000)
        };
      } catch (error) {
        return { success: false, error: error.message || "PX2 tab request failed" };
      } finally {
        clearTimeout(timeout);
      }
    },
    args: [request]
  });

  if (!result?.success) throw new Error(result?.error || "PX2 tab request failed");
  const { success, ...response } = result;
  return response;
}
