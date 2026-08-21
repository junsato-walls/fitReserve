"use client";

import { ReactNode } from "react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: ReactNode;
    onClick?: () => void;
    current?: boolean;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    separator?: ReactNode;
    showHomeIcon?: boolean;
    homeIcon?: ReactNode;
    className?: string;
    maxItems?: number;
    showCollapsed?: boolean;
}

export default function Breadcrumb({
    items,
    separator,
    showHomeIcon = true,
    homeIcon,
    className = '',
    maxItems,
    showCollapsed = true,
}: BreadcrumbProps) {
    // デフォルトの区切り文字
    const defaultSeparator = (
        <svg
            className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 9 4-4-4-4"
            />
        </svg>
    );

    // デフォルトのホームアイコン
    const defaultHomeIcon = (
        <svg
            className="w-3 h-3 me-2.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
        </svg>
    );

    const separatorElement = separator || defaultSeparator;
    const homeIconElement = homeIcon || defaultHomeIcon;

    // アイテムクリック処理
    const handleItemClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
        if (item.onClick) {
            event.preventDefault();
            item.onClick();
        }
    };

    // 最大表示数の制御
    let displayItems = items;
    if (maxItems && items.length > maxItems) {
        if (showCollapsed) {
            // 最初、省略記号、最後の数個を表示
            const firstItem = items[0];
            const lastItems = items.slice(-(maxItems - 2));
            displayItems = [
                firstItem,
                { label: '...', current: false },
                ...lastItems
            ];
        } else {
            // 単純に最後のmaxItems個を表示
            displayItems = items.slice(-maxItems);
        }
    }

    return (
        <nav className={`flex ${className}`} aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                {displayItems.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === displayItems.length - 1;
                    const isCurrent = item.current || isLast;

                    // 省略記号の場合
                    if (item.label === '...') {
                        return (
                            <li key={`ellipsis-${index}`}>
                                <div className="flex items-center">
                                    {separatorElement}
                                    <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                                        ...
                                    </span>
                                </div>
                            </li>
                        );
                    }

                    return (
                        <li
                            key={index}
                            className={isFirst ? "inline-flex items-center" : ""}
                            aria-current={isCurrent ? "page" : undefined}
                        >
                            {/* 最初のアイテム */}
                            {isFirst ? (
                                <>
                                    {item.href && !isCurrent ? (
                                        <a
                                            href={item.href}
                                            onClick={(e) => handleItemClick(item, e)}
                                            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors"
                                        >
                                            {showHomeIcon && (isFirst && !item.icon) ? homeIconElement : item.icon}
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {showHomeIcon && (isFirst && !item.icon) ? homeIconElement : item.icon}
                                            {item.label}
                                        </span>
                                    )}
                                </>
                            ) : (
                                /* その他のアイテム */
                                <div className="flex items-center">
                                    {separatorElement}
                                    {item.href && !isCurrent ? (
                                        <a
                                            href={item.href}
                                            onClick={(e) => handleItemClick(item, e)}
                                            className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white transition-colors"
                                        >
                                            {item.icon && <span className="me-2">{item.icon}</span>}
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                                            {item.icon && <span className="me-2">{item.icon}</span>}
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}