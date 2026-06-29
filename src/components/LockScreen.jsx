import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'

export default function LockScreen({ lock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = async event => { event.preventDefault(); if (!await lock.unlock(code)) { setError('رمز ورود اشتباه است'); setCode('') } }
  const biometric = async () => { if (!await lock.biometricUnlock()) setError('احراز هویت دستگاه انجام نشد') }
  return <div className="lock-screen"><LockKeyhole/><h1>میرزا</h1><p>رمز چهار رقمی را وارد کنید</p><form onSubmit={submit}><input autoFocus inputMode="numeric" maxLength="4" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}/>{error && <span>{error}</span>}<button>باز کردن برنامه</button>{lock.biometricAvailable && <button type="button" className="biometric-unlock" onClick={biometric}>باز کردن با اثر انگشت</button>}</form></div>
}
