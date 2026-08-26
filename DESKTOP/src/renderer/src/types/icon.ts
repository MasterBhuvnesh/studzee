export interface AppIconProps {
  Icon: React.ComponentType<{
    size?: number
    color?: string
    fill?: string
    strokeWidth?: number
    style?: React.CSSProperties
  }>
  size?: number
  color?: string
  fill?: string
  strokeWidth?: number
  style?: React.CSSProperties
}
