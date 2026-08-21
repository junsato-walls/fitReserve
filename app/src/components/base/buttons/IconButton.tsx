import { ButtonHTMLAttributes, cloneElement, isValidElement, MouseEvent, ReactElement, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    variant?: 'primary' | 'outline' | 'ghost' | 'transparent';
    size?: 'sm' | 'md' | 'lg';
    shape?: 'square' | 'rounded';
    srLabel: string; // アクセシビリティ用のラベル
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void;
    onMouseLeave?: (event: MouseEvent<HTMLButtonElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
}

export default function IconButton({
    icon,
    variant = 'primary',
    size = 'md',
    shape = 'square',
    srLabel,
    className = '',
    disabled,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...props
}: IconButtonProps) {
    // バリアント別のスタイル
    const variantStyles = {
        primary: `
            text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 active:scale-95
        `,
        outline: `
            text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white active:bg-blue-900 active:scale-95
        `,
        ghost: `
            text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-blue-900 active:scale-95
        `,
        transparent: `
            text-gray-600 hover:text-blue-600 bg-transparent hover:bg-white/10 active:bg-blue-900 active:scale-95
        `
    };

    // サイズ別のスタイル
    const sizeStyles = {
        sm: 'p-2 text-sm',
        md: 'p-2.5 text-sm',
        lg: 'p-3 text-base'
    };

    // アイコンサイズ
    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    // 形状別のスタイル
    const shapeStyles = {
        square: 'rounded-lg',
        rounded: 'rounded-full'
    };

    // 基本スタイル
    const baseStyles = `
        font-medium text-center inline-flex items-center justify-center
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        me-2
    `;

    // 最終的なクラス名を組み合わせ
    const finalClassName = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        shapeStyles[shape],
        className
    ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // アイコンにサイズクラスを追加
    const renderIconWithSize = (iconElement: ReactNode) => {
        if (!iconElement) return null;

        // ReactElementの場合、cloneElementを使用
        if (isValidElement(iconElement)) {
            // ReactElementとして型キャスト
            const element = iconElement as ReactElement<{ className?: string }>;
            const existingClassName = element.props.className || '';

            return cloneElement(element, {
                ...element.props,
                className: `${iconSizeClasses[size]} ${existingClassName}`.trim(),
            });
        }

        // SVG要素を直接受け取った場合
        return (
            <span className={`${iconSizeClasses[size]} inline-block`} aria-hidden="true">
                {iconElement}
            </span>
        );
    };

    return (
        <button
            type="button"
            className={finalClassName}
            disabled={disabled}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
        >
            {renderIconWithSize(icon)}
            <span className="sr-only">{srLabel}</span>
        </button>
    );
}