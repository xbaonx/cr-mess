import './globals.css';
import 'antd/dist/reset.css';
import React from 'react';

export const metadata = {
  title: 'F-wallet Admin',
  description: 'Admin Portal for F-wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
