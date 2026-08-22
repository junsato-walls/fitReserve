"use client";

import { Children, cloneElement, forwardRef, isValidElement, ReactElement, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
    // コンテンツ設定
    content: ReactNode;
    children: ReactNode;

    // 配置設定
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
    offset?: number;

    // 表示制御
    trigger?: 'hover' | 'click' | 'focus' | 'manual';
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    defaultVisible?: boolean;

    // 遅延設定
    showDelay?: number;
    hideDelay?: number;

    // 動作設定
    disabled?: boolean;
    interactive?: boolean;
    arrow?: boolean;
    hideOnClick?: boolean;

    // スタイル設定
    className?: string;
    contentClassName?: string;
    arrowClassName?: string;
    variant?: 'dark' | 'light' | 'success' | 'warning' | 'error';

    // その他
    id?: string;
    zIndex?: number;
    portal?: boolean;
    portalContainer?: Element;
}

// プロップス型定義
interface ElementProps {
    ref?: React.Ref<HTMLElement>;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    'aria-describedby'?: string;
    [key: string]: unknown;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({
    content,
    children,
    placement = 'top',
    offset = 8,
    trigger = 'hover',
    visible: controlledVisible,
    onVisibleChange,
    defaultVisible = false,
    showDelay = 0,
    hideDelay = 0,
    disabled = false,
    interactive = false,
    arrow = true,
    hideOnClick = true,
    className = '',
    contentClassName = '',
    arrowClassName = '',
    variant = 'dark',
    id = 'tooltip',
    zIndex = 10,
    portal = true,
    portalContainer,
}, ref) => {
    // 内部状態管理
    const [internalVisible, setInternalVisible] = useState(defaultVisible);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // 現在の表示状態を決定
    const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

    // refs
    const triggerRef = useRef<HTMLElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    // 外部から渡されたrefをツールチップ本体と同期させる
    useImperativeHandle(ref, () => tooltipRef.current as HTMLDivElement, []);
    const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // 表示状態の変更
    const updateVisibility = useCallback((visible: boolean) => {
        if (controlledVisible !== undefined) {
            onVisibleChange?.(visible);
        } else {
            setInternalVisible(visible);
            onVisibleChange?.(visible);
        }
    }, [controlledVisible, onVisibleChange]);

    // 位置計算
    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        let top = 0;
        let left = 0;

        switch (placement) {
            case 'top':
                top = triggerRect.top + scrollY - tooltipRect.height - offset;
                left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'top-start':
                top = triggerRect.top + scrollY - tooltipRect.height - offset;
                left = triggerRect.left + scrollX;
                break;
            case 'top-end':
                top = triggerRect.top + scrollY - tooltipRect.height - offset;
                left = triggerRect.right + scrollX - tooltipRect.width;
                break;
            case 'bottom':
                top = triggerRect.bottom + scrollY + offset;
                left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom-start':
                top = triggerRect.bottom + scrollY + offset;
                left = triggerRect.left + scrollX;
                break;
            case 'bottom-end':
                top = triggerRect.bottom + scrollY + offset;
                left = triggerRect.right + scrollX - tooltipRect.width;
                break;
            case 'left':
                top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.left + scrollX - tooltipRect.width - offset;
                break;
            case 'left-start':
                top = triggerRect.top + scrollY;
                left = triggerRect.left + scrollX - tooltipRect.width - offset;
                break;
            case 'left-end':
                top = triggerRect.bottom + scrollY - tooltipRect.height;
                left = triggerRect.left + scrollX - tooltipRect.width - offset;
                break;
            case 'right':
                top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.right + scrollX + offset;
                break;
            case 'right-start':
                top = triggerRect.top + scrollY;
                left = triggerRect.right + scrollX + offset;
                break;
            case 'right-end':
                top = triggerRect.bottom + scrollY - tooltipRect.height;
                left = triggerRect.right + scrollX + offset;
                break;
        }

        setPosition({ top, left });
    }, [placement, offset]);

    // 表示処理
    const show = useCallback(() => {
        if (disabled) return;

        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = undefined;
        }

        if (showDelay > 0) {
            showTimeoutRef.current = setTimeout(() => {
                updateVisibility(true);
            }, showDelay);
        } else {
            updateVisibility(true);
        }
    }, [disabled, showDelay, updateVisibility]);

    // 非表示処理
    const hide = useCallback(() => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
            showTimeoutRef.current = undefined;
        }

        if (hideDelay > 0) {
            hideTimeoutRef.current = setTimeout(() => {
                updateVisibility(false);
            }, hideDelay);
        } else {
            updateVisibility(false);
        }
    }, [hideDelay, updateVisibility]);

    // 位置更新
    useEffect(() => {
        if (isVisible) {
            calculatePosition();

            const handleResize = () => calculatePosition();
            const handleScroll = () => calculatePosition();

            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isVisible, calculatePosition]);

    // Escapeキーで閉じる（WAI-ARIA Tooltipパターンの必須要件）
    //
    // ツールチップが本来の内容に重なって読めない場合に、
    // フォーカスを移さずに閉じられる手段を提供する。
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            // 表示待ちのタイマーが残っていると閉じた直後に再表示されるため止める
            if (showTimeoutRef.current) {
                clearTimeout(showTimeoutRef.current);
                showTimeoutRef.current = undefined;
            }
            updateVisibility(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, updateVisibility]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (showTimeoutRef.current) {
                clearTimeout(showTimeoutRef.current);
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    // イベントハンドラー
    const handleMouseEnter = useCallback(() => {
        if (trigger === 'hover') {
            show();
        }
    }, [trigger, show]);

    const handleMouseLeave = useCallback(() => {
        if (trigger === 'hover') {
            hide();
        }
    }, [trigger, hide]);

    const handleClick = useCallback(() => {
        if (trigger === 'click') {
            if (isVisible) {
                hide();
            } else {
                show();
            }
        } else if (hideOnClick && isVisible) {
            hide();
        }
    }, [trigger, isVisible, show, hide, hideOnClick]);

    const handleFocus = useCallback(() => {
        if (trigger === 'focus') {
            show();
        }
    }, [trigger, show]);

    const handleBlur = useCallback(() => {
        if (trigger === 'focus') {
            hide();
        }
    }, [trigger, hide]);

    // バリアント別のスタイル
    const getVariantStyles = () => {
        switch (variant) {
            case 'light':
                return {
                    tooltip: 'bg-white text-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg dark:bg-gray-100 dark:text-gray-900',
                    arrow: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                };
            case 'success':
                return {
                    tooltip: 'bg-green-600 text-white dark:bg-green-500',
                    arrow: 'bg-green-600 dark:bg-green-500'
                };
            case 'warning':
                return {
                    tooltip: 'bg-yellow-500 text-white dark:bg-yellow-400',
                    arrow: 'bg-yellow-500 dark:bg-yellow-400'
                };
            case 'error':
                return {
                    tooltip: 'bg-red-600 text-white dark:bg-red-500',
                    arrow: 'bg-red-600 dark:bg-red-500'
                };
            default: // 'dark'
                return {
                    tooltip: 'bg-gray-900 text-white dark:bg-gray-700',
                    arrow: 'bg-gray-900 dark:bg-gray-700'
                };
        }
    };

    // 矢印の位置とスタイル
    const getArrowStyles = () => {
        const baseArrowClasses = "absolute w-2 h-2 transform rotate-45";

        switch (placement) {
            case 'top':
            case 'top-start':
            case 'top-end':
                return {
                    position: 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2',
                    classes: baseArrowClasses
                };
            case 'bottom':
            case 'bottom-start':
            case 'bottom-end':
                return {
                    position: 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
                    classes: baseArrowClasses
                };
            case 'left':
            case 'left-start':
            case 'left-end':
                return {
                    position: 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2',
                    classes: baseArrowClasses
                };
            case 'right':
            case 'right-start':
            case 'right-end':
                return {
                    position: 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2',
                    classes: baseArrowClasses
                };
            default:
                return {
                    position: 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2',
                    classes: baseArrowClasses
                };
        }
    };

    const variantStyles = getVariantStyles();
    const arrowStyles = getArrowStyles();

    // 子要素にイベントハンドラーを追加
    const triggerElement = Children.only(children) as ReactElement;

    const clonedTriggerElement = isValidElement(triggerElement)
        ? cloneElement(triggerElement, {
            ref: (node: HTMLElement | null) => {
                triggerRef.current = node;
                // 元のrefも保持 - 型安全にアクセス
                const elementWithRef = triggerElement as ReactElement & { ref?: React.Ref<HTMLElement> };
                const originalRef = elementWithRef.ref;
                if (typeof originalRef === 'function') {
                    originalRef(node);
                } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
                    (originalRef as React.MutableRefObject<HTMLElement | null>).current = node;
                }
            },
            onMouseEnter: (e: React.MouseEvent) => {
                const originalProps = triggerElement.props as ElementProps;
                if (originalProps?.onMouseEnter) {
                    originalProps.onMouseEnter(e);
                }
                handleMouseEnter();
            },
            onMouseLeave: (e: React.MouseEvent) => {
                const originalProps = triggerElement.props as ElementProps;
                if (originalProps?.onMouseLeave) {
                    originalProps.onMouseLeave(e);
                }
                handleMouseLeave();
            },
            onClick: (e: React.MouseEvent) => {
                const originalProps = triggerElement.props as ElementProps;
                if (originalProps?.onClick) {
                    originalProps.onClick(e);
                }
                handleClick();
            },
            onFocus: (e: React.FocusEvent) => {
                const originalProps = triggerElement.props as ElementProps;
                if (originalProps?.onFocus) {
                    originalProps.onFocus(e);
                }
                handleFocus();
            },
            onBlur: (e: React.FocusEvent) => {
                const originalProps = triggerElement.props as ElementProps;
                if (originalProps?.onBlur) {
                    originalProps.onBlur(e);
                }
                handleBlur();
            },
            'aria-describedby': isVisible ? id : undefined,
        } as ElementProps)
        : triggerElement;

    // ツールチップコンテンツ
    const tooltipContent = isVisible ? (
        <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className={`
                absolute inline-block px-3 py-2 text-sm font-medium
                transition-opacity duration-300 rounded-lg shadow-sm
                ${variantStyles.tooltip}
                ${isVisible ? 'opacity-100' : 'opacity-0 invisible'}
                ${contentClassName}
                ${className}
            `}
            style={{
                top: position.top,
                left: position.left,
                zIndex: zIndex,
            }}
            onMouseEnter={() => {
                if (interactive && trigger === 'hover') {
                    if (hideTimeoutRef.current) {
                        clearTimeout(hideTimeoutRef.current);
                        hideTimeoutRef.current = undefined;
                    }
                }
            }}
            onMouseLeave={() => {
                if (interactive && trigger === 'hover') {
                    hide();
                }
            }}
        >
            {content}
            {arrow && (
                <div
                    className={`
                        ${arrowStyles.classes}
                        ${arrowStyles.position}
                        ${variantStyles.arrow}
                        ${arrowClassName}
                    `}
                    data-popper-arrow
                />
            )}
        </div>
    ) : null;

    return (
        <>
            {clonedTriggerElement}
            {tooltipContent && portal && typeof document !== 'undefined'
                ? createPortal(tooltipContent, portalContainer || document.body)
                : tooltipContent
            }
        </>
    );
});

Tooltip.displayName = 'Tooltip';