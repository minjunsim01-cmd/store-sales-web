'use client';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD, saveSession, userDocId } from '@/lib/localAuth';

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
      const cleanName = name.trim();
      const id = userDocId(cleanName);
      const ref = doc(db, 'users', id);
      let snap = await getDoc(ref);

      if(!snap.exists() && cleanName === DEFAULT_ADMIN_NAME && password === DEFAULT_ADMIN_PASSWORD){
        const admin: UserProfile = { uid:id, name:DEFAULT_ADMIN_NAME, role:'admin', storeName:'본점', password:DEFAULT_ADMIN_PASSWORD };
        await setDoc(ref, admin);
        snap = await getDoc(ref);
      }

      if(!snap.exists()) throw new Error('no user');
      const user = snap.data() as UserProfile;
      if(user.password !== password) throw new Error('bad password');
      saveSession({ uid:id, name:user.name, role:user.role, storeName:user.storeName || '본점' });
      location.href='/input';
    }
    catch{
      setError('이름 또는 비밀번호를 확인해주세요. 최초 관리자는 심민준 / 12345678 입니다.');
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
