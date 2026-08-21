"use client";

import { forwardRef, KeyboardEvent, ReactNode, useCallback, useId, useMemo, useRef, useState } from "react";

export interface TabItem {
    id: string;
    label: ReactNode;
    content?: ReactNode;
    disabled?: boolean;
    href?: string;
    onClick?: () => void;
}

export interface TabsProps {
    // タブ設定
    tabs: TabItem[];
    defaultActiveTab?: string;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;

    // 表示設定
    variant?: 'default' | 'underline' | 'pills';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;

    // スタイル設定
    className?: string;
    tabListClassName?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    disabledTabClassName?: string;
    contentClassName?: string;

    // その他
    'aria-label'?: string;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(({
    tabs,
    defaultActiveTab,
    activeTab: controlledActiveTab,
    onTabChange,
    variant = 'default',
    size = 'md',
    fullWidth = false,
    className = '',
    tabListClassName = '',
    tabClassName = '',
    activeTabClassName = '',
    disabledTabClassName = '',
    contentClassName = '',
    'aria-label': ariaLabel,
}, ref) => {
    // 内部状態管理（非制御モード）
    const [internalActiveTab, setInternalActiveTab] = useState<string>(() => {
        if (defaultActiveTab) return defaultActiveTab;
        const firstEnabledTab = tabs.find(tab => !tab.disabled);
        return firstEnabledTab?.id || '';
    });

    // 現在のアクティブタブを決定
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

    const reactId = useId();
    const baseId = `tabs-${reactId}`;
    const getTabId = useCallback((tabId: string) => `${baseId}-tab-${tabId}`, [baseId]);
    const getPanelId = useCallback((tabId: string) => `${baseId}-panel-${tabId}`, [baseId]);

    // 矢印キーで移動した際にフォーカスを当てるためのタブ要素の参照
    const tabRefs = useRef<Map<string, HTMLElement>>(new Map());

    const activeIndex = useMemo(
        () => tabs.findIndex(tab => tab.id === activeTab),
        [tabs, activeTab]
    );

    // タブ変更ハンドラー
    const handleTabChange = useCallback((tabId: string, tab: TabItem) => {
        if (tab.disabled) return;

        // カスタムonClickがある場合は実行
        if (tab.onClick) {
            tab.onClick();
        }

        // 外部制御の場合はonTabChangeを呼ぶだけ
        if (controlledActiveTab !== undefined) {
            onTabChange?.(tabId);
        } else {
            // 内部制御の場合は状態を更新
            setInternalActiveTab(tabId);
            onTabChange?.(tabId);
        }
    }, [controlledActiveTab, onTabChange]);

    /** 指定位置から探して、最初に見つかる有効なタブの位置を返す（端は反対側へ回り込む） */
    const findEnabledIndex = useCallback(
        (start: number, direction: 1 | -1): number => {
            const count = tabs.length;
            if (count === 0) return -1;

            for (let i = 0; i < count; i++) {
                const index = (start + direction * i + count * count) % count;
                if (!tabs[index]?.disabled) return index;
            }
            return -1;
        },
        [tabs]
    );

    /** 指定位置のタブを選択し、そこへフォーカスを移す */
    const activateTabAt = useCallback(
        (index: number) => {
            const tab = tabs[index];
            if (!tab || tab.disabled) return;

            handleTabChange(tab.id, tab);
            // 選択と同時にフォーカスも移動させる（ARIA Tabsの自動アクティベーション）
            tabRefs.current.get(tab.id)?.focus();
        },
        [tabs, handleTabChange]
    );

    /**
     * タブリストのキーボード操作（WAI-ARIA Tabsパターン）
     * 左右矢印で移動、Home/Endで端へ。無効なタブは飛ばす。
     */
    const handleTabListKeyDown = useCallback(
        (event: KeyboardEvent<HTMLUListElement>) => {
            switch (event.key) {
                case 'ArrowRight':
                    event.preventDefault();
                    activateTabAt(findEnabledIndex(activeIndex + 1, 1));
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    activateTabAt(findEnabledIndex(activeIndex - 1, -1));
                    break;
                case 'Home':
                    event.preventDefault();
                    activateTabAt(findEnabledIndex(0, 1));
                    break;
                case 'End':
                    event.preventDefault();
                    activateTabAt(findEnabledIndex(tabs.length - 1, -1));
                    break;
            }
        },
        [activeIndex, findEnabledIndex, activateTabAt, tabs.length]
    );

    // バリアント別のスタイル
    const getVariantStyles = () => {
        switch (variant) {
            case 'underline':
                return {
                    tabList: "flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400",
                    tab: "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
                    activeTab: "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500",
                    disabledTab: "text-gray-400 cursor-not-allowed dark:text-gray-500"
                };
            case 'pills':
                return {
                    tabList: "flex flex-wrap text-sm font-medium text-center",
                    tab: "inline-block px-4 py-2 mx-1 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white",
                    activeTab: "text-white bg-blue-600 dark:bg-blue-500",
                    disabledTab: "text-gray-400 cursor-not-allowed dark:text-gray-500"
                };
            default: // 'default'
                return {
                    tabList: "flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400",
                    tab: "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                    activeTab: "text-blue-600 bg-gray-100 active dark:bg-gray-800 dark:text-blue-500",
                    disabledTab: "text-gray-400 cursor-not-allowed dark:text-gray-500"
                };
        }
    };

    // サイズ別のスタイル
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return "text-xs p-2";
            case 'lg':
                return "text-base p-6";
            default: // 'md'
                return "text-sm p-4";
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    // アクティブなタブのコンテンツを取得
    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div ref={ref} className={`w-full ${className}`}>
            {/* タブリスト */}
            <ul
                className={`${variantStyles.tabList} ${fullWidth ? 'w-full' : ''} ${tabListClassName}`}
                role="tablist"
                aria-label={ariaLabel}
                onKeyDown={handleTabListKeyDown}
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTab;
                    const isDisabled = tab.disabled;

                    // ローミングtabindex: Tabキーでタブリストに入るのは選択中の1つだけにし、
                    // タブ間の移動は矢印キーで行う（WAI-ARIA Tabsパターン）
                    const rovingTabIndex = isActive ? 0 : -1;

                    // 矢印キー移動時にフォーカスを当てるため要素を保持する
                    const registerTabRef = (el: HTMLElement | null) => {
                        if (el) {
                            tabRefs.current.set(tab.id, el);
                        } else {
                            tabRefs.current.delete(tab.id);
                        }
                    };

                    // タブのクラス名を組み立て
                    const tabClasses = `
                        ${variantStyles.tab}
                        ${sizeStyles}
                        ${isActive ? `${variantStyles.activeTab} ${activeTabClassName}` : ''}
                        ${isDisabled ? `${variantStyles.disabledTab} ${disabledTabClassName}` : ''}
                        ${fullWidth ? 'flex-1' : ''}
                        ${index === tabs.length - 1 ? '' : 'me-2'}
                        ${tabClassName}
                    `.trim();

                    return (
                        <li key={tab.id} className={fullWidth ? 'flex-1' : (index === tabs.length - 1 ? '' : 'me-2')}>
                            {tab.href && !isDisabled ? (
                                <a
                                    ref={registerTabRef}
                                    id={getTabId(tab.id)}
                                    href={tab.href}
                                    className={tabClasses}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={tab.content ? getPanelId(tab.id) : undefined}
                                    tabIndex={rovingTabIndex}
                                    onClick={(e) => {
                                        if (!isDisabled) {
                                            e.preventDefault();
                                            handleTabChange(tab.id, tab);
                                        }
                                    }}
                                >
                                    {tab.label}
                                </a>
                            ) : (
                                <button
                                    ref={registerTabRef}
                                    id={getTabId(tab.id)}
                                    type="button"
                                    className={tabClasses}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={tab.content ? getPanelId(tab.id) : undefined}
                                    disabled={isDisabled}
                                    tabIndex={rovingTabIndex}
                                    onClick={() => handleTabChange(tab.id, tab)}
                                >
                                    {tab.label}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* タブコンテンツ */}
            {activeTabContent && (
                <div
                    id={getPanelId(activeTab)}
                    className={`mt-4 ${contentClassName}`}
                    role="tabpanel"
                    // 対応するタブと相互参照させる（旧実装は存在しないidを参照していた）
                    aria-labelledby={getTabId(activeTab)}
                    // パネル内に操作可能な要素が無い場合でも、キーボードで内容へ到達できるようにする
                    tabIndex={0}
                >
                    {activeTabContent}
                </div>
            )}
        </div>
    );
});

Tabs.displayName = 'Tabs';

export default Tabs;