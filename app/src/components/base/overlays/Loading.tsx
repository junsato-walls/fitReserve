"use client";

import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Spinner from "../feedback/Spinner";

export interface LoadingProps {
    // 表示制御
    visible?: boolean;

    // コンテンツ設定
    text?: string;
    description?: string;

    // スピナー設定
    spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
    spinnerColor?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple';

    // 動作設定
    preventBodyScroll?: boolean;
    closeOnEscape?: boolean;
    onClose?: () => void;

    // スタイル設定
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
    backdropBlur?: boolean;

    // その他
    portal?: boolean;
    portalContainer?: Element;
    zIndex?: number;
}

const Loading = forwardRef<HTMLDivElement, LoadingProps>(({
    visible = false,
    text = 'Loading...',
    description,
    spinnerSize = 'lg',
    spinnerColor = 'blue',
    preventBodyScroll = true,
    closeOnEscape = false,
    onClose,
    className = '',
    overlayClassName = '',
    contentClassName = '',
    backdropBlur = false,
    portal = true,
    portalContainer,
    zIndex = 9999,
}, ref) => {
    // ESCキーでクローズ
    useEffect(() => {
        if (!visible || !closeOnEscape || !onClose) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, closeOnEscape, onClose]);

    // ボディスクロール制御
    useEffect(() => {
        if (!preventBodyScroll) return;

        if (visible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [visible, preventBodyScroll]);

    // 非表示の場合は何もレンダリングしない
    if (!visible) {
        return null;
    }

    const loadingContent = (
        <div
            ref={ref}
            className={`
                fixed inset-0 flex items-center justify-center
                bg-black bg-opacity-50
                ${backdropBlur ? 'backdrop-blur-sm' : ''}
                transition-opacity duration-200
                ${overlayClassName}
                ${className}
            `}
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="loading-title"
            aria-describedby={description ? "loading-description" : undefined}
        >
            {/* ローディングコンテンツ */}
            <div
                className={`
                    bg-white dark:bg-gray-800 
                    rounded-lg shadow-xl 
                    p-8 mx-4 
                    max-w-sm w-full
                    text-center
                    transform transition-all duration-200
                    ${contentClassName}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* スピナー */}
                <div className="flex justify-center mb-4">
                    <Spinner
                        size={spinnerSize}
                        color={spinnerColor}
                        showText={false}
                        centered={false}
                    />
                </div>

                {/* テキスト */}
                <h3
                    id="loading-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                    {text}
                </h3>

                {/* 説明文 */}
                {description && (
                    <p
                        id="loading-description"
                        className="text-sm text-gray-500 dark:text-gray-400"
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>
    );

    // ポータルを使用する場合
    if (portal && typeof document !== 'undefined') {
        const container = portalContainer || document.body;
        return createPortal(loadingContent, container);
    }

    // 通常のレンダリング
    return loadingContent;
});

Loading.displayName = 'Loading';

export default Loading;