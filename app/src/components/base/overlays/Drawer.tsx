"use client";

import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
import { useOverlayA11y } from "./useOverlayA11y";

export interface DrawerAction {
    id: string;
    label: ReactNode;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: ReactNode;
    className?: string;
}

export interface DrawerProps {
    // 表示制御
    open?: boolean;
    onOpenChange?: (open: boolean) => void;

    // コンテンツ設定
    title?: ReactNode;
    children?: ReactNode;
    actions?: DrawerAction[];

    // 配置設定
    placement?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

    // 動作設定
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    preventBodyScroll?: boolean;
    destroyOnClose?: boolean;

    // スタイル設定
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;

    // その他
    id?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    portal?: boolean;
    portalContainer?: Element;
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(({
    open = false,
    onOpenChange,
    title,
    children,
    actions = [],
    placement = 'left',
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    preventBodyScroll = true,
    destroyOnClose = false,
    className = '',
    overlayClassName = '',
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    id = 'drawer',
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    portal = true,
    portalContainer,
}, ref) => {
    // ドロワー本体（フォーカストラップ・初期フォーカスの対象）への内部ref。
    // 外部からのref（forwardRef）はuseImperativeHandleでこれと同期させる。
    const contentRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => contentRef.current as HTMLDivElement, []);

    // 最外周のオーバーレイ（背景を隠す際に「自分自身」を判別するために使う）
    const overlayRef = useRef<HTMLDivElement>(null);

    // フォーカストラップ・フォーカス復帰・背景の隠蔽（Modalと共通）
    useOverlayA11y({ open, contentRef, rootRef: overlayRef });

    // クローズハンドラー
    const handleClose = useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    // ESCキーでクローズ
    useEffect(() => {
        if (!open || !closeOnEscape) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, handleClose]);

    // ボディスクロール制御
    useEffect(() => {
        if (!preventBodyScroll) return;

        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open, preventBodyScroll]);

    // オーバーレイクリックハンドラー
    const handleOverlayClick = useCallback((event: React.MouseEvent) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            handleClose();
        }
    }, [closeOnOverlayClick, handleClose]);

    // 配置別のスタイル
    const getPlacementStyles = () => {
        switch (placement) {
            case 'right':
                return {
                    container: 'top-0 right-0',
                    transform: open ? 'translate-x-0' : 'translate-x-full'
                };
            case 'top':
                return {
                    container: 'top-0 left-0 w-full',
                    transform: open ? 'translate-y-0' : '-translate-y-full'
                };
            case 'bottom':
                return {
                    container: 'bottom-0 left-0 w-full',
                    transform: open ? 'translate-y-0' : 'translate-y-full'
                };
            default: // 'left'
                return {
                    container: 'top-0 left-0',
                    transform: open ? 'translate-x-0' : '-translate-x-full'
                };
        }
    };

    // サイズ別のスタイル
    const getSizeStyles = () => {
        const isVertical = placement === 'left' || placement === 'right';

        if (isVertical) {
            switch (size) {
                case 'sm':
                    return 'w-64';
                case 'lg':
                    return 'w-96';
                case 'xl':
                    return 'w-[32rem]';
                case 'full':
                    return 'w-full';
                default: // 'md'
                    return 'w-80';
            }
        } else {
            switch (size) {
                case 'sm':
                    return 'h-64';
                case 'lg':
                    return 'h-96';
                case 'xl':
                    return 'h-[32rem]';
                case 'full':
                    return 'h-full';
                default: // 'md'
                    return 'h-80';
            }
        }
    };

    // デフォルトアイコン
    const getDefaultIcon = () => (
        <svg className="w-4 h-4 me-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
    );

    const placementStyles = getPlacementStyles();
    const sizeStyles = getSizeStyles();

    // 非表示時かつdestroyOnCloseがtrueの場合は何もレンダリングしない
    if (!open && destroyOnClose) {
        return null;
    }

    const drawerContent = (
        // 背景隠蔽は「兄弟要素」を対象にするため、オーバーレイと本体を1要素にまとめる
        // （フラグメントのままだと本体だけが基準になり、オーバーレイ自身を隠してしまう）
        <div ref={overlayRef}>
            {/* オーバーレイ */}
            {open && (
                <div
                    className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${overlayClassName}`}
                    onClick={handleOverlayClick}
                    aria-hidden="true"
                />
            )}

            {/* ドローワー本体 */}
            {/*
              閉じている間もDOMに残り、transformで画面外へ退避する実装のため、
              inert/aria-hiddenで「見えていない間は操作も読み上げもされない」状態にする。
              これが無いと閉じた後もドロワー内の要素にフォーカスが残り続ける。
            */}
            <div
                ref={contentRef}
                id={id}
                className={`
                    fixed z-40 h-screen p-4 overflow-y-auto transition-transform
                    bg-white dark:bg-gray-800
                    ${placementStyles.container}
                    ${sizeStyles}
                    ${placementStyles.transform}
                    ${className}
                `}
                tabIndex={-1}
                inert={!open}
                aria-hidden={!open || undefined}
                aria-labelledby={ariaLabelledby}
                aria-describedby={ariaDescribedby}
                role="dialog"
                aria-modal="true"
            >
                {/* ヘッダー */}
                {title && (
                    <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
                        <h5
                            id={ariaLabelledby || `${id}-label`}
                            className="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
                        >
                            {getDefaultIcon()}
                            {title}
                        </h5>

                        <button
                            type="button"
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 end-2.5 flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
                            onClick={handleClose}
                            aria-label="Close drawer"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14">
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                />
                            </svg>
                            <span className="sr-only">Close menu</span>
                        </button>
                    </div>
                )}

                {/* ボディ */}
                <div className={`flex-1 ${bodyClassName}`}>
                    {children}
                </div>

                {/* フッター（アクション） */}
                {actions.length > 0 && (
                    <div className={`grid grid-cols-2 gap-4 mt-6 ${footerClassName}`}>
                        {actions.map((action) => {
                            const getActionClasses = () => {
                                const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-center rounded-lg focus:outline-none focus:ring-4";

                                switch (action.variant) {
                                    case 'primary':
                                        return `${baseClasses} text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800`;
                                    case 'ghost':
                                        return `${baseClasses} text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600`;
                                    default: // 'secondary'
                                        return `${baseClasses} text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`;
                                }
                            };

                            return action.href ? (
                                <a
                                    key={action.id}
                                    href={action.href}
                                    className={`${getActionClasses()} ${action.className || ''}`}
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                    {action.icon}
                                </a>
                            ) : (
                                <button
                                    key={action.id}
                                    type="button"
                                    className={`${getActionClasses()} ${action.className || ''}`}
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                    {action.icon}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // ポータルを使用する場合
    if (portal && typeof document !== 'undefined') {
        const container = portalContainer || document.body;
        return createPortal(drawerContent, container);
    }

    // 通常のレンダリング
    return drawerContent;
});

Drawer.displayName = 'Drawer';

export default Drawer;