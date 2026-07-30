import { Bricolage_Grotesque, Public_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Injection Lab — talk a chatbot out of its password',
  description:
    'Three vaults, three defences, one lesson: a prompt is not a security boundary. A hands-on prompt injection workshop.',
};

export const viewport = {
  themeColor: '#0b1a2e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
