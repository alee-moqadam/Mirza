import { useCallback, useEffect, useState } from 'react'

const LAST_ACTIVE_KEY = 'personal-finance-last-active'
const durations = { 'بعد از ۱ دقیقه': 60000, 'بعد از ۵ دقیقه': 300000, 'بعد از ۱۵ دقیقه': 900000, 'بعد از ۳۰ دقیقه': 1800000 }
export const hashPasscode = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('')

export function useAppLock(settings = {}) {
  const shouldLock = () => settings.enabled && settings.autoLock !== 'فوری' && Date.now() - Number(localStorage.getItem(LAST_ACTIVE_KEY) || 0) >= (durations[settings.autoLock] ?? 60000)
  const [locked, setLocked] = useState(() => Boolean(settings.enabled))
  const touch = useCallback(() => { if (!locked) localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())) }, [locked])
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown', 'scroll']
    events.forEach(event => window.addEventListener(event, touch, { passive: true }))
    const timer = setInterval(() => shouldLock() && setLocked(true), 1000)
    const visibility = () => settings.enabled && settings.autoLock === 'فوری' && document.hidden && setLocked(true)
    document.addEventListener('visibilitychange', visibility)
    return () => { events.forEach(event => window.removeEventListener(event, touch)); document.removeEventListener('visibilitychange', visibility); clearInterval(timer) }
  }, [touch, settings.enabled, settings.autoLock])
  const unlock = async passcode => {
    if (await hashPasscode(passcode) !== settings.passcodeHash) return false
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())); setLocked(false); return true
  }
  const biometricUnlock = async () => {
    if (!settings.biometricCredentialId || !window.PublicKeyCredential) return false
    try {
      const raw = Uint8Array.from(atob(settings.biometricCredentialId), char => char.charCodeAt(0))
      await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ id: raw, type: 'public-key' }], userVerification: 'required', timeout: 60000 } })
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())); setLocked(false); return true
    } catch { return false }
  }
  return { locked, unlock, biometricUnlock, biometricAvailable: Boolean(settings.biometricCredentialId && window.PublicKeyCredential), setLocked }
}
