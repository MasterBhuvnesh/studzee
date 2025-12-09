import { colors } from '@/constants/colors';

/**
 * All available color groups from the color palette
 */
export type ColorGroup = keyof typeof colors;

/**
 * Available shades for a given color group
 */
export type ColorShade<G extends ColorGroup> = keyof (typeof colors)[G];

/**
 * Get the actual color value for a specific group and shade
 */
export type ColorValue<
  G extends ColorGroup,
  S extends ColorShade<G>,
> = (typeof colors)[G][S];
