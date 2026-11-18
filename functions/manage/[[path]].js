import { proxyRemDashboard } from "../_shared/rembot-dashboard-proxy.js";

export function onRequest(context) {
  return proxyRemDashboard(context);
}
