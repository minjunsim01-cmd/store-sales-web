'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale } from '@/lib/types';
import Link from 'next/link';

const weekdays=['일','월','화','수','목','금','토'];
const blank=(day:number,year:number,month:number)=>({day,weekday:weekdays[new Date(year,month-1,day).getDay()],creditCard:0,starCard:0,dollar:0,won:0,wonAmount:0,dailySales:0,managerName:''});
export default function Report(){
  const now=new Date(); const [year,setYear]=useState(now.getFullYear()); const [month,setMonth]=useState(now.getMonth()+1); const [sales,setSales]=useState<Sale[]>([]);
  useEffect(()=>onSnapshot(query(collection(db,'sales'),where('year','==',year),where('month','==',month)),snap=>setSales(snap.docs.map(d=>({id:d.id,...d.data()} as Sale)))),[year,month]);
  const rows=useMemo(()=>Array.from({length:31},(_,i)=>{const day=i+1; const list=sales.filter(s=>s.day===day); const row=blank(day,year,month); row.creditCard=list.reduce((a,s)=>a+(s.creditCard||0),0); row.starCard=list.reduce((a,s)=>a+(s.starCard||0),0); row.dollar=list.reduce((a,s)=>a+(s.dollar||0),0); row.won=list.reduce((a,s)=>a+(s.won||0),0); row.wonAmount=row.won; row.dailySales=row.creditCard+row.starCard+row.wonAmount; row.managerName=[...new Set(list.map(s=>s.managerName).filter(Boolean))].join(', '); return row;}),[sales,year,month]);
  const money=(n:number)=>n?Math.round(n).toLocaleString():'';
  return <main className="container"><div className="nav no-print"><Link href="/input">매출 입력</Link><Link href="/dashboard">대시보드</Link></div><div className="card"><div className="print-actions no-print"><label>연도 <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}/></label> <label>월 <input type="number" min="1" max="12" value={month} onChange={e=>setMonth(Number(e.target.value))}/></label> <button onClick={()=>window.print()}>인쇄 / PDF 저장</button></div><table className="sales-table"><thead><tr><th className="report-title" colSpan={8}>매 장 매 출</th></tr><tr><th>연도</th><th>월</th><th colSpan={2}>카 드</th><th colSpan={3}>현 금</th><th></th></tr><tr><th>{year}</th><th>{month}</th><th>크레딧카드</th><th>스타카드</th><th>달러</th><th>원화</th><th>원화금액</th><th>일별매출 / 담당자</th></tr></thead><tbody>{rows.map(r=><tr key={r.day}><td colSpan={2}>{r.day}일&nbsp;&nbsp;{r.weekday}요일</td><td>{money(r.creditCard)}</td><td>{money(r.starCard)}</td><td>{money(r.dollar)}</td><td>{money(r.won)}</td><td>{money(r.wonAmount)}</td><td>{money(r.dailySales)} {r.managerName&&`/ ${r.managerName}`}</td></tr>)}</tbody></table></div></main>
}
