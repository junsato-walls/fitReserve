"use client";

import { forwardRef, ReactNode, useCallback, useMemo, useState } from "react";
import { BADGE_BASE_CLASS, BADGE_TONE_CLASSES, type BadgeTone } from "./Badge";

// バッジの語彙と配色は base/Badge が一元管理する。
// Table 利用側が Badge を直接importせずに済むよう再エクスポートする。
export type { BadgeTone };

/**
 * 列の表示形式
 *
 * 見た目の指定（色・余白・角丸など）は base/Table 側が一元管理する。
 * 画面ごとにJSXを書けるようにすると表現がばらつくため、
 * ここで用途を宣言してもらい、描画方法はTable側が決める。
 */
export type TableColumnType =
    /** 値をそのまま表示する（既定） */
    | 'text'
    /** 色付きバッジ。badgeToneで色、formatで表示文言を指定する */
    | 'badge'
    /** 真偽値を「有効/無効」のように色分けして表示する */
    | 'boolean';

export interface TableColumn<T = unknown> {
    id: string;
    header: ReactNode;
    /** 表示する値のキー */
    accessor?: keyof T;
    /** 表示形式（既定はtext） */
    type?: TableColumnType;
    /** 表示文言の変換（例: "pending" → "予約受付"）。文字列のみ返すこと */
    format?: (value: unknown, row: T) => string;
    /** type='badge' のとき、値ごとの色を決める */
    badgeTone?: (value: unknown, row: T) => BadgeTone;
    /** type='boolean' のときのラベル（既定は 有効/無効） */
    booleanLabels?: { true: string; false: string };
    /** 値が空のときに表示する文字列（既定は "-"） */
    emptyText?: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    headerClassName?: string;
}

export interface TableAction<T = unknown> {
    id: string;
    label: ReactNode;
    onClick: (row: T, index: number) => void;
    className?: string;
    href?: string;
    destructive?: boolean;
    /** 行ごとに操作を無効化する条件（例: 予約が入っている行は削除不可） */
    disabled?: (row: T, index: number) => boolean;
}

export interface TableProps<T = unknown> {
    // データ設定
    data: T[];
    columns: TableColumn<T>[];

    // 選択設定
    selectable?: boolean;
    selectedRows?: Set<string | number>;
    onSelectionChange?: (selectedRows: Set<string | number>) => void;
    getRowId?: (row: T, index: number) => string | number;

    // ソート設定
    sortable?: boolean;
    defaultSort?: {
        column: string;
        direction: 'asc' | 'desc';
    };
    onSort?: (column: string, direction: 'asc' | 'desc') => void;

    // アクション設定
    actions?: TableAction<T>[];
    actionsLabel?: string;

    // 表示設定
    striped?: boolean;
    hover?: boolean;
    bordered?: boolean;
    compact?: boolean;

    // 空状態
    emptyMessage?: ReactNode;
    loading?: boolean;
    loadingMessage?: ReactNode;

    // スタイル設定
    className?: string;
    tableClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;

    // ページネーション
    pagination?: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
    };

    // その他
    caption?: string;
}

/** 真偽値表示の色 */
const BOOLEAN_TONE = {
    true: 'text-green-600 font-medium',
    false: 'text-gray-500',
};

function TableComponent<T = unknown>(
    props: TableProps<T>,
    ref: React.Ref<HTMLDivElement>
) {
    const {
        data,
        columns,
        selectable = false,
        selectedRows = new Set(),
        onSelectionChange,
        getRowId = (_, index) => index,
        sortable = false,
        defaultSort,
        onSort,
        actions = [],
        actionsLabel = "操作",
        striped = false,
        hover = true,
        bordered = true,
        compact = false,
        emptyMessage = "データがありません",
        loading = false,
        loadingMessage = "読み込み中...",
        className = '',
        tableClassName = '',
        headerClassName = '',
        bodyClassName = '',
        pagination,
        caption,
    } = props;

    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(defaultSort || null);

    // 全選択の処理
    const handleSelectAll = useCallback(() => {
        if (!onSelectionChange) return;

        const allIds = data.map((row, index) => getRowId(row, index));
        const allSelected = allIds.every(id => selectedRows.has(id));

        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(allIds));
        }
    }, [data, selectedRows, onSelectionChange, getRowId]);

    // 個別選択の処理
    const handleSelectRow = useCallback((rowId: string | number) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedRows);
        if (newSelection.has(rowId)) {
            newSelection.delete(rowId);
        } else {
            newSelection.add(rowId);
        }
        onSelectionChange(newSelection);
    }, [selectedRows, onSelectionChange]);

    // ソート処理
    const handleSort = useCallback((columnId: string) => {
        if (!sortable) return;

        const column = columns.find(col => col.id === columnId);
        if (!column?.sortable) return;

        const direction =
            sortConfig?.column === columnId && sortConfig.direction === 'asc'
                ? 'desc'
                : 'asc';

        setSortConfig({ column: columnId, direction });
        onSort?.(columnId, direction);
    }, [sortable, columns, sortConfig, onSort]);

    // ソートされたデータ
    const sortedData = useMemo(() => {
        if (!sortConfig || onSort) return data; // 外部ソートの場合はそのまま返す

        const column = columns.find(col => col.id === sortConfig.column);
        if (!column?.accessor) return data;

        return [...data].sort((a, b) => {
            const aValue = (a as Record<string, unknown>)[column.accessor as string];
            const bValue = (b as Record<string, unknown>)[column.accessor as string];

            // 文字列変換して比較
            const aStr = String(aValue);
            const bStr = String(bValue);

            if (sortConfig.direction === 'asc') {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });
    }, [data, sortConfig, columns, onSort]);

    // セルの描画
    //
    // 画面側からJSXを受け取らず、column.type に応じてTable側が見た目を決める。
    // これにより全画面でバッジの色・角丸・余白が揃う。
    const getCellValue = (row: T, column: TableColumn<T>): ReactNode => {
        const raw = column.accessor
            ? (row as Record<string, unknown>)[column.accessor as string]
            : undefined;

        const emptyText = column.emptyText ?? '-';
        const type = column.type ?? 'text';

        if (type === 'boolean') {
            const labels = column.booleanLabels ?? { true: '有効', false: '無効' };
            const isTrue = Boolean(raw);
            return (
                <span className={isTrue ? BOOLEAN_TONE.true : BOOLEAN_TONE.false}>
                    {isTrue ? labels.true : labels.false}
                </span>
            );
        }

        if (type === 'badge') {
            if (raw === null || raw === undefined || raw === '') return emptyText;
            const text = column.format ? column.format(raw, row) : String(raw);
            const tone = column.badgeTone ? column.badgeTone(raw, row) : 'neutral';
            return (
                <span className={`${BADGE_BASE_CLASS} ${BADGE_TONE_CLASSES[tone]}`}>
                    {text}
                </span>
            );
        }

        // type === 'text'
        if (column.format) {
            const formatted = column.format(raw, row);
            return formatted === '' ? emptyText : formatted;
        }
        if (raw === null || raw === undefined || raw === '') return emptyText;
        return String(raw);
    };

    // 全選択状態の判定
    const isAllSelected = data.length > 0 && data.every((row, index) =>
        selectedRows.has(getRowId(row, index))
    );
    const isPartiallySelected = data.some((row, index) =>
        selectedRows.has(getRowId(row, index))
    ) && !isAllSelected;

    // テーブルのクラス
    const tableClasses = `
    w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400
    ${tableClassName}
  `;

    // ヘッダーのクラス
    const headerClasses = `
    text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400
    ${headerClassName}
  `;

    // 行のクラス
    const getRowClasses = (index: number) => {
        const baseClasses = "border-b dark:border-gray-700 border-gray-200";
        const bgClasses = striped && index % 2 === 1
            ? "bg-gray-50 dark:bg-gray-900"
            : "bg-white dark:bg-gray-800";
        const hoverClasses = hover ? "hover:bg-gray-50 dark:hover:bg-gray-600" : "";

        return `${baseClasses} ${bgClasses} ${hoverClasses}`;
    };

    // セルのクラス（compactを実装）
    const getCellClasses = (column: TableColumn<T>, isHeader = false) => {
        // compactの場合はパディングを小さくする
        const paddingClasses = compact
            ? (isHeader ? "px-3 py-2" : "px-3 py-2")
            : (isHeader ? "px-6 py-3" : "px-6 py-4");

        const alignClasses = {
            left: "text-left",
            center: "text-center",
            right: "text-right"
        };

        // 折り返して読みにくくなるのを防ぐ。溢れる場合はコンテナ側で横スクロールする
        return `
      ${paddingClasses}
      whitespace-nowrap
      ${column.align ? alignClasses[column.align] : ""}
      ${column.className || ""}
      ${isHeader ? column.headerClassName || "" : ""}
    `;
    };

    // チェックボックス列のクラス（compactを実装）
    const getCheckboxCellClasses = () => {
        return compact ? "w-4 p-2" : "w-4 p-4";
    };

    // アクション列のクラス（compactを実装）
    const getActionCellClasses = () => {
        // 折り返しを防ぎつつ、横スクロール時も操作列が常に見えるよう右端に固定する
        // （背景色を指定しないと下の行が透けるため bg も併せて指定）
        const base = "sticky right-0 z-10 flex items-center whitespace-nowrap bg-white dark:bg-gray-800";
        return compact ? `${base} px-3 py-2` : `${base} px-6 py-4`;
    };

    return (
        <div
            ref={ref}
            className={`relative overflow-x-auto ${bordered ? 'shadow-md sm:rounded-lg' : ''} ${className}`}
        >
            <table className={tableClasses}>
                {caption && <caption className="sr-only">{caption}</caption>}

                <thead className={headerClasses}>
                    <tr>
                        {/* 選択チェックボックス列 */}
                        {selectable && (
                            <th scope="col" className={compact ? "p-2" : "p-4"}>
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-search"
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = isPartiallySelected;
                                        }}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        aria-label="Select all rows"
                                    />
                                    <label htmlFor="checkbox-all-search" className="sr-only">checkbox</label>
                                </div>
                            </th>
                        )}

                        {/* データ列 */}
                        {columns.map((column) => {
                            const isSorted = sortConfig?.column === column.id;
                            const isSortable = column.sortable && sortable;

                            return (
                            <th
                                key={column.id}
                                scope="col"
                                className={getCellClasses(column, true)}
                                style={column.width ? { width: column.width } : undefined}
                                // ソート可能な列の現在の並び順を支援技術へ伝える
                                aria-sort={
                                    isSortable
                                        ? (isSorted
                                            ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                                            : 'none')
                                        : undefined
                                }
                            >
                                {isSortable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSort(column.id)}
                                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        <span>{column.header}</span>
                                        {isSorted && (
                                            <svg
                                                className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ) : (
                                    column.header
                                )}
                            </th>
                            );
                        })}

                        {/* アクション列 */}
                        {actions.length > 0 && (
                            // 列が多いと横スクロールで操作列が隠れてしまうため右端に固定する
                            <th
                                scope="col"
                                className={`sticky right-0 z-10 bg-gray-50 dark:bg-gray-700 ${compact ? "px-3 py-2" : "px-6 py-3"}`}
                            >
                                {actionsLabel}
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody className={bodyClassName}>
                    {loading ? (
                        <tr>
                            <td
                                colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                className={compact ? "px-3 py-4 text-center text-gray-500 dark:text-gray-400" : "px-6 py-8 text-center text-gray-500 dark:text-gray-400"}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{loadingMessage}</span>
                                </div>
                            </td>
                        </tr>
                    ) : sortedData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                className={compact ? "px-3 py-4 text-center text-gray-500 dark:text-gray-400" : "px-6 py-8 text-center text-gray-500 dark:text-gray-400"}
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, index) => {
                            const rowId = getRowId(row, index);
                            const isSelected = selectedRows.has(rowId);

                            return (
                                <tr key={rowId} className={getRowClasses(index)}>
                                    {/* 選択チェックボックス */}
                                    {selectable && (
                                        <td className={getCheckboxCellClasses()}>
                                            <div className="flex items-center">
                                                <input
                                                    id={`checkbox-table-search-${rowId}`}
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(rowId)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                    aria-label={`Select row ${index + 1}`}
                                                />
                                                <label htmlFor={`checkbox-table-search-${rowId}`} className="sr-only">checkbox</label>
                                            </div>
                                        </td>
                                    )}

                                    {/* データセル */}
                                    {columns.map((column, colIndex) => {
                                        const cellValue = getCellValue(row, column);
                                        const isFirstColumn = colIndex === 0;

                                        return isFirstColumn ? (
                                            <th
                                                key={column.id}
                                                scope="row"
                                                className={`
                                                    ${getCellClasses(column)}
                                                    font-medium text-gray-900 whitespace-nowrap dark:text-white
                                                `}
                                            >
                                                {cellValue}
                                            </th>
                                        ) : (
                                            <td
                                                key={column.id}
                                                className={getCellClasses(column)}
                                            >
                                                {cellValue}
                                            </td>
                                        );
                                    })}

                                    {/* アクション */}
                                    {actions.length > 0 && (
                                        <td className={getActionCellClasses()}>
                                            {actions.map((action) => (
                                                action.href ? (
                                                    <a
                                                        key={action.id}
                                                        href={action.href}
                                                        className={`
                                                            font-medium hover:underline
                                                            ${action.destructive
                                                                ? 'text-red-600 dark:text-red-500'
                                                                : 'text-blue-600 dark:text-blue-500'
                                                            }
                                                            ${action.className || ''}
                                                            ${action.id === actions[0].id ? '' : 'ms-3'}
                                                        `}
                                                    >
                                                        {action.label}
                                                    </a>
                                                ) : (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => action.onClick(row, index)}
                                                        disabled={action.disabled?.(row, index)}
                                                        className={`
                                                            font-medium hover:underline
                                                            disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline
                                                            ${action.destructive
                                                                ? 'text-red-600 dark:text-red-500'
                                                                : 'text-blue-600 dark:text-blue-500'
                                                            }
                                                            ${action.className || ''}
                                                            ${action.id === actions[0].id ? '' : 'ms-3'}
                                                        `}
                                                    >
                                                        {action.label}
                                                    </button>
                                                )
                                            ))}
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* ページネーション */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-400">
                        Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                        {pagination.totalItems} results
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                            className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {/* ページ番号 */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === pagination.currentPage;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => pagination.onPageChange(pageNum)}
                                    className={`
                                        px-3 py-1 text-sm font-medium border rounded-lg
                                        ${isActive
                                            ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-gray-700 dark:border-gray-700 dark:text-white'
                                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// 正しいforwardRef型定義
interface TableComponentType {
    <T = unknown>(props: TableProps<T> & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement;
    displayName?: string;
}

const Table = forwardRef(TableComponent) as TableComponentType;

Table.displayName = 'Table';

export default Table;