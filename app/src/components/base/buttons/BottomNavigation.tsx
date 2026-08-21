"use client";

import { ReactNode } from "react";

export interface BottomNavigationItem {
    id: string;
    label: string;
    icon: ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
}

export interface BottomNavigationProps {
    items: BottomNavigationItem[];
    activeId?: string;
    onItemClick?: (item: BottomNavigationItem) => void;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

export default function BottomNavigation({
    items,
    activeId,
    onItemClick,
    maxWidth = 'lg',
    className = '',
}: BottomNavigationProps) {
    // 最大幅のスタイル
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full'
    };

    // アイテムクリック処理
    const handleItemClick = (item: BottomNavigationItem) => {
        if (item.disabled) return;

        onItemClick?.(item);
        item.onClick?.();

        // hrefが指定されている場合はページ遷移
        if (item.href) {
            window.location.href = item.href;
        }
    };

    // グリッドのカラム数を動的に設定
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
    }[Math.min(items.length, 5)] || 'grid-cols-4';

    return (
        <div className={`fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600 ${className}`}>
            <div className={`grid h-full ${maxWidthClasses[maxWidth]} ${gridCols} mx-auto font-medium`}>
                {items.map((item) => {
                    const isActive = activeId === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => handleItemClick(item)}
                            className={`
                inline-flex flex-col items-center justify-center px-5 
                hover:bg-gray-50 dark:hover:bg-gray-800 group
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                ${isActive ? 'bg-gray-50 dark:bg-gray-800' : ''}
              `}
                        >
                            {/* アイコン */}
                            <div className={`
                w-5 h-5 mb-2 transition-colors
                ${isActive
                                    ? 'text-blue-600 dark:text-blue-500'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500'
                                }
                ${item.disabled ? 'group-hover:text-gray-500 dark:group-hover:text-gray-400' : ''}
              `}>
                                {item.icon}
                            </div>

                            {/* ラベル */}
                            <span className={`
                text-sm transition-colors
                ${isActive
                                    ? 'text-blue-600 dark:text-blue-500'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500'
                                }
                ${item.disabled ? 'group-hover:text-gray-500 dark:group-hover:text-gray-400' : ''}
              `}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}