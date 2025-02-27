'use client';

import React from 'react';
import Spreadsheet from '../components/Spreadsheet';
import '../app/globals.css';

export default function Home() {
  return (
    <main className="main-container">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">Google Sheets Clone</h1>
          <div className="header-controls">
            {/* Add any header buttons/controls here */}
          </div>
        </div>
      </header>
      <div className="spreadsheet-wrapper">
        <Spreadsheet />
      </div>
    </main>
  );
}