import { ImageSource } from 'expo-image';

/**
 * Props for the OnboardingScreen component
 */
export interface OnboardingScreenProps {
  title: string;
  description: string;
  gradientColors: string[];
  imageSource?: any; // Can be require() or URI string for jpg, png, svg, gif
}

/**
 * Props for the OAuthButtons component
 */
export interface OAuthButtonsProps {
  onError: (error: string) => void;
}

/**
 * Props for the Header component
 */
export interface HeaderProps {
  title: string;
}

/**
 * Props for the SettingCard component
 */
export interface SettingCardProps {
  title: string;
  items: SettingItem[];
}

/**
 * Individual setting item
 */
export interface SettingItem {
  label: string;
  onPress?: () => void;
  icon: React.ComponentType<any>;
}

/**
 * Props for the ResourceCard component
 */
export interface ResourceCardProps {
  title: string;
  items: ResourceItem[];
}

/**
 * Individual resource item
 */
export interface ResourceItem {
  label: string;
  onPress?: () => void;
  size?: string;
}

/**
 * Props for the DownloadedCard component
 */
export interface DownloadedCardProps {
  title: string;
  items: DownloadedItem[];
}

/**
 * Individual downloaded item
 */
export interface DownloadedItem {
  label: string;
  onPress?: () => void;
  size?: string;
  icon: React.ComponentType<any>;
}

/**
 * Props for the ActionCard component
 */
export interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  image: ImageSource;
  onPress?: () => void;
}

/**
 * Props for the ProfileCard component
 */
export interface ProfileCardProps {
  name: string;
  email: string;
  buttonText: string;
  image: string;
  onPress?: () => void;
}
