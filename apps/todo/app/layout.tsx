import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo — Loop Engineering Demo',
  description: 'Todolist API-first Next.js, développée en TDD par des agents IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}