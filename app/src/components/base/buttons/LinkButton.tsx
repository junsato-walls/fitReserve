"use client";

import { AnchorHTMLAttributes, forwardRef, ReactNode } from "react";

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
    // 表示内容
    children: ReactNode;

    // スタイル
    variant?: 'text' | 'contained' | 'outlined' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple';
    fullWidth?: boolean;

    // 状態
    disabled?: boolean;

    // リンク設定
    href: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
    external?: boolean; // 外部リンクの場合、自動的にtarget="_blank"とrel="noopener noreferrer"を設定

    // その他
    className?: string;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(({
    children,
    variant = 'text',
    size = 'md',
    color = 'blue',
    fullWidth = false,
    disabled = false,
    href,
    target,
    external = false,
    className = '',
    ...props
}, ref) => {
    // バリアント別スタイル
    const variantClasses = {
        text: {
            blue: 'text-blue-600 dark:text-blue-500 hover:underline',
            gray: 'text-gray-600 dark:text-gray-400 hover:underline',
            green: 'text-green-600 dark:text-green-500 hover:underline',
            red: 'text-red-600 dark:text-red-500 hover:underline',
            yellow: 'text-yellow-600 dark:text-yellow-500 hover:underline',
            purple: 'text-purple-600 dark:text-purple-500 hover:underline',
        },
        contained: {
            blue: 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
            gray: 'text-white bg-gray-700 hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800',
            green: 'text-white bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800',
            red: 'text-white bg-red-700 hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
            yellow: 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:focus:ring-yellow-800',
            purple: 'text-white bg-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800',
        },
        outlined: {
            blue: 'text-blue-700 border border-blue-700 hover:bg-blue-50 focus:ring-blue-300 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900 dark:focus:ring-blue-800',
            gray: 'text-gray-700 border border-gray-700 hover:bg-gray-50 focus:ring-gray-300 dark:text-gray-400 dark:border-gray-400 dark:hover:bg-gray-900 dark:focus:ring-gray-800',
            green: 'text-green-700 border border-green-700 hover:bg-green-50 focus:ring-green-300 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900 dark:focus:ring-green-800',
            red: 'text-red-700 border border-red-700 hover:bg-red-50 focus:ring-red-300 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900 dark:focus:ring-red-800',
            yellow: 'text-yellow-700 border border-yellow-700 hover:bg-yellow-50 focus:ring-yellow-300 dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-900 dark:focus:ring-yellow-800',
            purple: 'text-purple-700 border border-purple-700 hover:bg-purple-50 focus:ring-purple-300 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900 dark:focus:ring-purple-800',
        },
        ghost: {
            blue: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-300 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus:ring-blue-800',
            gray: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-900 dark:focus:ring-gray-800',
            green: 'text-green-600 hover:bg-green-50 focus:ring-green-300 dark:text-green-400 dark:hover:bg-green-900 dark:focus:ring-green-800',
            red: 'text-red-600 hover:bg-red-50 focus:ring-red-300 dark:text-red-400 dark:hover:bg-red-900 dark:focus:ring-red-800',
            yellow: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-300 dark:text-yellow-400 dark:hover:bg-yellow-900 dark:focus:ring-yellow-800',
            purple: 'text-purple-600 hover:bg-purple-50 focus:ring-purple-300 dark:text-purple-400 dark:hover:bg-purple-900 dark:focus:ring-purple-800',
        },
    };

    // サイズ別スタイル
    const sizeClasses = {
        sm: variant === 'text' ? 'text-xs' : 'text-xs px-3 py-1.5',
        md: variant === 'text' ? 'text-sm' : 'text-sm px-5 py-2.5',
        lg: variant === 'text' ? 'text-base' : 'text-base px-6 py-3',
    };

    // 基本クラス
    const baseClasses = variant === 'text'
        ? 'font-medium transition-colors'
        : 'font-medium rounded-lg focus:ring-4 focus:outline-none transition-colors inline-block text-center';

    // 外部リンクの場合の設定
    const linkTarget = external ? '_blank' : target;
    const linkRel = external ? 'noopener noreferrer' : props.rel;

    // 無効化時のスタイル
    const disabledClasses = disabled
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : '';

    const finalClassName = `
    ${baseClasses}
    ${variantClasses[variant][color]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabledClasses}
    ${className}
  `.trim();

    return (
        <a
            ref={ref}
            href={disabled ? undefined : href}
            target={linkTarget}
            rel={linkRel}
            className={finalClassName}
            aria-disabled={disabled}
            {...props}
        >
            {children}
        </a>
    );
});

LinkButton.displayName = 'LinkButton';