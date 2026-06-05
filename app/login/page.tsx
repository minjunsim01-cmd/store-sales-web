'use client';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function LoginPage(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState('');
  async function login(e:FormEvent){
    e.preventDefault(); setError('');
    try{ await signInWithEmailAndPassword(auth,email,password); location.href='/input'; }
    catch{ setError('로그인 정보를 확인해주세요.'); }
  }
  return <main className="container"><div className="card"><h1>직원 로그인</h1><form onSubmit={login} className="grid"><label className="field">아이디/이메일<input value={email} onChange={e=>setEmail(e.target.value)} required /></label><label className="field">비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button>로그인</button></form>{error&&<p>{error}</p>}<p><Link href="/">처음으로</Link></p></div></main>
}
