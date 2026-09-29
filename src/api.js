let csrf = "",
  branch = "main";
export const setCsrf = (v) => (csrf = v);
export const setBranch = (v) => (branch = v);
export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch("/api/v1" + path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(!isForm ? { "Content-Type": "application/json" } : {}),
      "x-csrf-token": csrf,
      "x-branch": branch,
      ...options.headers,
    },
    body: options.body
      ? isForm
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const e = Error(data.error?.message || "Request failed");
    e.code = data.error?.code;
    e.status = response.status;
    throw e;
  }
  if (data.csrf) setCsrf(data.csrf);
  return data;
}
export async function download(path, filename) {
  const r = await fetch("/api/v1" + path, { headers: { "x-branch": branch } });
  if (!r.ok) {
    const d = await r.json();
    throw Error(d.error?.message || "Download failed");
  }
  const url = URL.createObjectURL(await r.blob()),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export const currency = (v) =>
  "PKR " +
  (Number(v || 0) / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 });
export const grams = (v) =>
  (Number(v || 0) / 1000).toLocaleString("en-PK", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }) + " g";
export const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        timeZone: "Asia/Karachi",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
