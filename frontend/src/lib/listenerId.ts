const KEY = "onplay-listener-id";

let cached: string | null = null;

export function getListenerId(): string {
  if (cached) return cached;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    // localStorage blocked (private mode edge cases)
    return "anonymous";
  }
}
