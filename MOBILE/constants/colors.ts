/**
 * TailwindCSS Zinc Color Palette
 * A neutral gray palette perfect for modern UI designs
 */

export const colors = {
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
} as const;

// Type-safe color access
export type ZincShade = keyof typeof colors.zinc;




