import { AppIconProps } from '@renderer/types/icon';
import React from 'react';

export const AppIcon: React.FC<AppIconProps> = ({
    Icon,
    size = 24,
    color = '#ffffff',
    strokeWidth = 2,
    fill = 'transparent',
    style,
}) => {
    return (
        <Icon
            size={size}
            color={color}
            strokeWidth={strokeWidth}
            style={style}
            fill={fill}
        />
    );
};
