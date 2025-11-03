// src/app/layout.tsx
import "./globals.css";
// If your project has a shared stylesheet from earlier work, keep this too:
import "@/index.css"; // ← if this file exists in your repo; otherwise remove this line.

export const metadata = { title: "Thaiba Garden Media Manager" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gradient-to-b from-[var(--tg-bg-from)] to-[var(--tg-bg-to)] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
