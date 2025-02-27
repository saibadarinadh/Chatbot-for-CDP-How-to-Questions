// src/app/layout.js
import '../app/globals.css';
export const metadata = {
  title: 'Google Sheets Clone',
  description: 'A web application that mimics Google Sheets functionality',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: 'Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}