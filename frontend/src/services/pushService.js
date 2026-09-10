const API_URL = import.meta.env.VITE_API_URL || '/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
};

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
};

export const checkPushSubscribed = async () => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
};

export const subscribeToPush = async (token) => {
  try {
    const reg = await navigator.serviceWorker.ready;
    const res = await fetch(`${API_URL}/push/vapid-public-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { publicKey } = await res.json();
    if (!publicKey) throw new Error('VAPID key not configured on server');

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscription }),
    });
    return true;
  } catch (err) {
    console.error('Push subscribe failed:', err);
    throw err;
  }
};

export const unsubscribeFromPush = async (token) => {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch(`${API_URL}/push/subscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
    throw err;
  }
};
