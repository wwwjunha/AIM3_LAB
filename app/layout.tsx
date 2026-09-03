import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '콩콩 과학실험실',
  description: '누르고 움직이며 직접 발견하는 어린이 가상 과학실험실',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
