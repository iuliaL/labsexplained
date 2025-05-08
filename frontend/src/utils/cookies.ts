export function getCookie(name: string): string | null {
  const cookies = document.cookie.split('; ');
  for (const c of cookies) {
    const [key, val] = c.split('=');
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}
