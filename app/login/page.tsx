'use client';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { normalizeLoginName, makeLocalEmail } from '@/lib/date';

export default function LoginPage(){
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function login(e:FormEvent){
    e.preventDefault();
    setError('');
    setLoading(true);
    try{
      const loginId = normalizeLoginName(name);
      let email = makeLocalEmail(name);
      const loginDoc = await getDoc(doc(db,'loginNames',loginId));
      if(loginDoc.exists()){
        const data = loginDoc.data() as {email?: string};
        if(data.email) email = data.email;
      }
      await signInWithEmailAndPassword(auth,email,password);
      location.href='/input';
    }
    catch{
      setError('이름 또는 비밀번호를 확인해주세요.');
    }
    finally{setLoading(false);}
  }
  return <main className="login-page">
    <div className="login-card">
      <img src="/logo.png" alt="BBQ Outpost" className="login-logo" />
      <h1>매장세일즈</h1>
      <p className="muted">이름과 비밀번호로 로그인하세요.</p>
      <form onSubmit={login} className="grid one">
        <label className="field">이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 심민준" required /></label>
        <label className="field">비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        <button disabled={loading}>{loading?'로그인 중...':'로그인'}</button>
      </form>
      {error&&<p className="error">{error}</p>}
    </div>
  </main>
}
