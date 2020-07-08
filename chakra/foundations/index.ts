import { borders } from './borders';
import { breakpoints } from './breakpoints';
import { colors } from './colors';
import { radii } from './radius';
import { shadows } from './shadows';
import { sizes, baseSizes } from './sizes';
import { typography } from './typography';
import { zIndices } from './z-index';

const space = baseSizes;

export const foundations = {
  breakpoints,
  colors,
  radii,
  zIndices,
  ...typography,
  borders,
  shadows,
  sizes,
  space,
};

export type Theme = typeof foundations;