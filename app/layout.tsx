import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '콩콩 과학실험실',
  description: '누르고 움직이며 직접 발견하는 어린이 가상 과학실험실',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" />
    </head>
    <body>{children}</body>
  </html>;
}
