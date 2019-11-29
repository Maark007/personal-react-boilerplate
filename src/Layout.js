import React, { Suspense } from 'react';
import { Column } from 'rbx';
import { Footer, Navbar } from './components';

export default function Layout({ children }) {
  return (
    <>
      <Column.Group centered as="header">
        <Column
          widescreen={{ size: 9 }}
          desktop={{ size: 9 }}
          tablet={{ size: 12 }}
          mobile={{ size: 12 }}
        >
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
        </Column>
      </Column.Group>
      <main style={{ flex: 1, display: 'flex' }}>{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
