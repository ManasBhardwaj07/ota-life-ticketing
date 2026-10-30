/**
 * The ONLY place the API URL lives (per Section 5 and Section 8 D6/P4).
 * Using ADB reverse forwarding: adb reverse tcp:3000 tcp:3000
 * The device reaches the laptop host at 127.0.0.1:3000 without LAN assumptions.
 */
export const API_BASE_URL = "http://127.0.0.1:3000";
