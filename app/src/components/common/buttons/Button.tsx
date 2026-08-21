import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    children: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    // バリアント別のスタイル
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
    };

    // サイズ別のスタイル
    const sizeStyles = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg'
    };

    // 基本スタイル
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // 幅のスタイル
    const widthStyles = fullWidth ? 'w-full' : '';

    // 最終的なクラス名を組み合わせ
    const finalClassName = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={finalClassName}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

// アイコンボタン用のコンポーネント
export function IconButton({
    children,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}: ButtonProps) {
    const sizeStyles = {
        xs: 'p-1',
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
        xl: 'p-4'
    };

    return (
        <Button
            variant={variant}
            className={`${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </Button>
    );
}