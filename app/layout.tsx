import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '매장세일즈', description: '매장 매출 기록 및 월별 인쇄' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
