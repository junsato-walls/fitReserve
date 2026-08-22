"use client";

import { forwardRef, ReactNode, useState } from "react";

export interface AlertProps {
    // 基本設定
    type?: 'info' | 'success' | 'warning' | 'error' | 'dark';
    title?: string;
    message: string;

    // 表示設定
    dismissible?: boolean;
    showIcon?: boolean;
    icon?: ReactNode;

    // スタイル設定
    variant?: 'filled' | 'outlined' | 'soft';
    size?: 'sm' | 'md' | 'lg';

    // イベント
    onDismiss?: () => void;

    // その他
    className?: string;
    role?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(({
    type = 'info',
    title,
    message,
    dismissible = false,
    showIcon = true,
    icon,
    variant = 'soft',
    size = 'md',
    onDismiss,
    className = '',
    role = 'alert',
}, ref) => {
    const [isVisible, setIsVisible] = useState(true);

    // サイズクラス
    const getSizeClasses = () => {
        const sizes = {
            sm: 'p-3 text-xs',
            md: 'p-4 text-sm',
            lg: 'p-6 text-base'
        } as const;

        return sizes[size];
    };

    // タイプ別スタイル
    const getTypeStyles = () => {
        const styles = {
            info: {
                soft: 'text-blue-800 bg-blue-50 dark:bg-gray-800 dark:text-blue-400',
                filled: 'text-white bg-blue-600 dark:bg-blue-600',
                outlined: 'text-blue-800 border border-blue-300 bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800',
                icon: 'text-blue-800 dark:text-blue-400',
                defaultIcon: (
                    <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                    </svg>
                )
            },
            success: {
                soft: 'text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400',
                filled: 'text-white bg-green-600 dark:bg-green-600',
                outlined: 'text-green-800 border border-green-300 bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800',
                icon: 'text-green-800 dark:text-green-400',
                defaultIcon: (
                    <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                )
            },
            warning: {
                soft: 'text-yellow-800 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300',
                filled: 'text-white bg-yellow-600 dark:bg-yellow-600',
                outlined: 'text-yellow-800 border border-yellow-300 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800',
                icon: 'text-yellow-800 dark:text-yellow-300',
                defaultIcon: (
                    <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 0 1-1-1V6a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1Z" />
                    </svg>
                )
            },
            error: {
                soft: 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400',
                filled: 'text-white bg-red-600 dark:bg-red-600',
                outlined: 'text-red-800 border border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800',
                icon: 'text-red-800 dark:text-red-400',
                defaultIcon: (
                    <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                    </svg>
                )
            },
            dark: {
                soft: 'text-gray-800 bg-gray-50 dark:bg-gray-800 dark:text-gray-300',
                filled: 'text-white bg-gray-800 dark:bg-gray-200',
                outlined: 'text-gray-800 border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
                icon: 'text-gray-800 dark:text-gray-300',
                defaultIcon: (
                    <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                    </svg>
                )
            }
        } as const;

        return styles[type];
    };

    // 閉じる処理
    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    // 非表示の場合は何も表示しない
    if (!isVisible) return null;

    const sizeClasses = getSizeClasses();
    const typeStyles = getTypeStyles();

    return (
        <div
            ref={ref}
            role={role}
            className={`
        flex items-center rounded-lg mb-4
        ${sizeClasses}
        ${typeStyles[variant]}
        ${className}
      `}
        >
            {/* アイコン */}
            {showIcon && (
                <div className={typeStyles.icon}>
                    {icon || typeStyles.defaultIcon}
                    <span className="sr-only">{type}</span>
                </div>
            )}

            {/* コンテンツ */}
            <div className="flex-1">
                {title && (
                    <span className="font-medium">{title}</span>
                )}
                {title && message && ' '}
                {message}
            </div>

            {/* 閉じるボタン */}
            {dismissible && (
                <button
                    type="button"
                    onClick={handleDismiss}
                    className={`
            ms-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5
            inline-flex items-center justify-center h-8 w-8
            transition-colors duration-150
            ${variant === 'filled'
                            ? 'text-white/70 hover:text-white hover:bg-white/20 dark:hover:bg-gray-800/20 focus:ring-white/50'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200 focus:ring-gray-300 dark:focus:ring-gray-800 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-600'
                        }
          `}
                    aria-label="Dismiss"
                >
                    <span className="sr-only">Dismiss</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            )}
        </div>
    );
});

Alert.displayName = 'Alert';