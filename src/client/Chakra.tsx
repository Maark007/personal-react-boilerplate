import {
  CSSReset,
  ThemeProvider,
  ColorModeProvider,
  PortalManager,
  GlobalStyle,
  ColorMode,
} from '@chakra-ui/core';
import React, { ReactNode } from 'react';

import { attachComponentBreadcrumb } from '../utils/sentry';
import { MetaThemeColorSynchronizer } from './components/common/MetaThemeColorSynchronizer';
import { withPersistedTheme } from './hooks/useThemePersistence';

export interface ChakraProps {
  children: ReactNode;
  initialColorMode: ColorMode;
}

export function Chakra({ children, initialColorMode }: ChakraProps) {
  attachComponentBreadcrumb('chakra');

  return (
    <>
      <ThemeProvider theme={withPersistedTheme(initialColorMode)}>
        <ColorModeProvider>
          <GlobalStyle />
          <CSSReset />
          <MetaThemeColorSynchronizer />
          <PortalManager zIndex={40}>{children}</PortalManager>
        </ColorModeProvider>
      </ThemeProvider>
      <style jsx global>
        {`
          body,
          div {
            transition: background-color 150ms ease-in-out;
          }
        `}
      </style>
    </>
  );
}
