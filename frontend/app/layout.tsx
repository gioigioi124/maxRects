import React from 'react';
export const metadata = {
  title: 'MaxRects Optimizer',
  description: 'Foam Cutting Optimizer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
