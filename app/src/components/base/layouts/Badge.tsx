"use client";

import { forwardRef, ReactNode } from "react";

/**
 * バッジの用途。生のカラークラスを画面側に書かせないための語彙。
 * 色そのものはここで一元管理し、Table のバッジ列とも共有する。
 */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** 用途バッジの共通スタイル */
export const BADGE_BASE_CLASS =
    'inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap';

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
    neutral: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
};

export interface BadgeProps {
    // 基本設定
    children: ReactNode;
    /** 用途で色を決める。指定した場合は color / variant / rounded より優先される */
    tone?: BadgeTone;
    color?: 'default' | 'dark' | 'red' | 'green' | 'yellow' | 'indigo' | 'purple' | 'pink';

    // スタイル設定
    variant?: 'default' | 'outlined' | 'filled';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    rounded?: 'sm' | 'md' | 'lg' | 'full';

    // 追加機能
    removable?: boolean;
    icon?: ReactNode;
    dot?: boolean;

    // イベント
    onRemove?: () => void;
    onClick?: () => void;

    // その他
    className?: string;
    as?: 'span' | 'div' | 'button';
}

const Badge = forwardRef<HTMLElement, BadgeProps>(({
    children,
    tone,
    color = 'default',
    variant = 'default',
    size = 'sm',
    rounded = 'sm',
    removable = false,
    icon,
    dot = false,
    onRemove,
    onClick,
    className = '',
    as = 'span',
}, ref) => {

    // カラークラス
    const getColorClasses = () => {
        const colors = {
            default: {
                default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                outlined: 'text-blue-800 border border-blue-400 dark:text-blue-400 dark:border-blue-400',
                filled: 'bg-blue-500 text-white'
            },
            dark: {
                default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                outlined: 'text-gray-800 border border-gray-400 dark:text-gray-300 dark:border-gray-500',
                filled: 'bg-gray-800 text-white dark:bg-gray-600'
            },
            red: {
                default: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                outlined: 'text-red-800 border border-red-400 dark:text-red-400 dark:border-red-400',
                filled: 'bg-red-500 text-white'
            },
            green: {
                default: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                outlined: 'text-green-800 border border-green-400 dark:text-green-400 dark:border-green-400',
                filled: 'bg-green-500 text-white'
            },
            yellow: {
                default: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                outlined: 'text-yellow-800 border border-yellow-400 dark:text-yellow-300 dark:border-yellow-400',
                filled: 'bg-yellow-500 text-white'
            },
            indigo: {
                default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
                outlined: 'text-indigo-800 border border-indigo-400 dark:text-indigo-400 dark:border-indigo-400',
                filled: 'bg-indigo-500 text-white'
            },
            purple: {
                default: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
                outlined: 'text-purple-800 border border-purple-400 dark:text-purple-400 dark:border-purple-400',
                filled: 'bg-purple-500 text-white'
            },
            pink: {
                default: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
                outlined: 'text-pink-800 border border-pink-400 dark:text-pink-400 dark:border-pink-400',
                filled: 'bg-pink-500 text-white'
            }
        } as const;

        return colors[color][variant];
    };

    // サイズクラス
    const getSizeClasses = () => {
        const sizes = {
            xs: 'text-xs px-2 py-0.5',
            sm: 'text-xs px-2.5 py-0.5',
            md: 'text-sm px-3 py-1',
            lg: 'text-base px-4 py-1.5'
        } as const;

        return sizes[size];
    };

    // 角丸クラス
    const getRoundedClasses = () => {
        const roundedClasses = {
            sm: 'rounded-sm',
            md: 'rounded-md',
            lg: 'rounded-lg',
            full: 'rounded-full'
        } as const;

        return roundedClasses[rounded];
    };

    // クリック可能かどうか
    const isClickable = onClick || as === 'button';

    // 基本クラス
    // tone を指定した場合は用途ベースの配色に統一する（色の指定はできない）
    const baseClasses = tone
        ? `
    inline-flex items-center
    ${BADGE_BASE_CLASS}
    ${BADGE_TONE_CLASSES[tone]}
    ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity duration-150' : ''}
    ${className}
  `
        : `
    inline-flex items-center font-medium me-2
    ${getSizeClasses()}
    ${getColorClasses()}
    ${getRoundedClasses()}
    ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity duration-150' : ''}
    ${className}
  `;

    // コンテンツ
    const content = (
        <>
            {/* ドット */}
            {dot && (
                <span className="w-2 h-2 rounded-full bg-current me-1 opacity-60" />
            )}

            {/* アイコン */}
            {icon && (
                <span className="me-1">
                    {icon}
                </span>
            )}

            {/* テキスト */}
            <span>{children}</span>

            {/* 削除ボタン */}
            {removable && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    className="ms-1 -me-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors duration-150"
                    aria-label="Remove"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </>
    );

    // 要素タイプに応じてレンダリング
    if (as === 'button') {
        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                onClick={onClick}
                className={baseClasses}
                type="button"
            >
                {content}
            </button>
        );
    }

    if (as === 'div') {
        return (
            <div
                ref={ref as React.Ref<HTMLDivElement>}
                onClick={onClick}
                className={baseClasses}
            >
                {content}
            </div>
        );
    }

    // デフォルトは span
    return (
        <span
            ref={ref as React.Ref<HTMLSpanElement>}
            onClick={onClick}
            className={baseClasses}
        >
            {content}
        </span>
    );
});

Badge.displayName = 'Badge';

export default Badge;