import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

/**
 * Transparent to page-background fade sitting on top of the scroll area,
 * just above the tab bar. Content scrolls underneath it so long lists end
 * softly instead of being cut by the bar. Never intercepts touches.
 */
export const BottomFade = ({ height = 56 }: { height?: number }) => (
  <LinearGradient
    pointerEvents="none"
    // rgba twin of colors.zinc[100], the bottom stop of every tab background
    colors={['rgba(244, 244, 245, 0)', colors.zinc[100]]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}
  />
);
