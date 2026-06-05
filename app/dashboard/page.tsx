'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard(){
  const [sales,setSales]=useState<Sale[]>([]);
  useEffect(()=>onSnapshot(query(collection(db,'sales'),orderBy('date','desc')),snap=>setSales(snap.docs.map(d=>({id:d.id,...d.data()} as Sale)))),[]);
  const now=new Date(); const monthSales=sales.filter(s=>s.year===now.getFullYear()&&s.month===now.getMonth()+1);
  const total=(k:keyof Sale)=>monthSales.reduce((sum,s)=>sum+(Number(s[k])||0),0);
  return <main className="container"><div className="nav"><Link href="/input">매출 입력</Link><Link href="/report">월별 매출표</Link></div><h1>관리자 대시보드</h1><div className="kpi"><div>이번 달 크레딧카드<br/><b>{total('creditCard').toLocaleString()}</b></div><div>이번 달 스타카드<br/><b>{total('starCard').toLocaleString()}</b></div><div>이번 달 달러<br/><b>{total('dollar').toLocaleString()}</b></div><div>이번 달 원화<br/><b>{total('won').toLocaleString()}</b></div></div><div className="card"><h2>최근 입력 내역</h2><table className="sales-table"><thead><tr><th>날짜</th><th>담당자</th><th>크레딧카드</th><th>스타카드</th><th>달러</th><th>원화</th><th>메모</th></tr></thead><tbody>{sales.slice(0,20).map(s=><tr key={s.id}><td>{s.date}</td><td>{s.managerName}</td><td>{s.creditCard?.toLocaleString()}</td><td>{s.starCard?.toLocaleString()}</td><td>{s.dollar?.toLocaleString()}</td><td>{s.won?.toLocaleString()}</td><td>{s.memo}</td></tr>)}</tbody></table></div></main>
}
