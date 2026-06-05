import Link from 'next/link';
export default function Home(){return <main className="container"><h1>매장세일즈</h1><p>직원 로그인 후 매출을 입력하고 월말 매출표를 인쇄합니다.</p><div className="nav"><Link href="/login">로그인</Link><Link href="/input">매출 입력</Link><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link></div></main>}
