import { ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

// テーブル全体のプロパティ
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
    children: ReactNode;
    striped?: boolean;
    bordered?: boolean;
    hover?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// テーブルヘッダーのプロパティ
interface TableHeadProps {
    children: ReactNode;
}

// テーブルボディのプロパティ
interface TableBodyProps {
    children: ReactNode;
}

// テーブル行のプロパティ
interface TableRowProps {
    children: ReactNode;
    className?: string;
}

// テーブルヘッダーセルのプロパティ
interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
    children: ReactNode;
    sortable?: boolean;
    onSort?: () => void;
}

// テーブルデータセルのプロパティ
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
    children: ReactNode;
}

// メインのTableコンポーネント
export default function Table({
    children,
    striped = false,
    bordered = false,
    hover = false,
    size = 'md',
    className = '',
    ...props
}: TableProps) {
    const sizeStyles = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const baseStyles = 'w-full border-collapse';
    const stripedStyles = striped ? '[&_tbody_tr:nth-child(even)]:bg-gray-50' : '';
    const borderedStyles = bordered ? 'border border-gray-200' : '';
    const hoverStyles = hover ? '[&_tbody_tr]:hover:bg-gray-100' : '';

    const finalClassName = [
        baseStyles,
        sizeStyles[size],
        stripedStyles,
        borderedStyles,
        hoverStyles,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="overflow-x-auto">
            <table className={finalClassName} {...props}>
                {children}
            </table>
        </div>
    );
}

// テーブルヘッダー
export function TableHead({ children }: TableHeadProps) {
    return (
        <thead className="bg-gray-50 border-b border-gray-200">
            {children}
        </thead>
    );
}

// テーブルボディ
export function TableBody({ children }: TableBodyProps) {
    return (
        <tbody className="bg-white divide-y divide-gray-200">
            {children}
        </tbody>
    );
}

// テーブル行
export function TableRow({ children, className = '' }: TableRowProps) {
    return (
        <tr className={className}>
            {children}
        </tr>
    );
}

// テーブルヘッダーセル
export function TableHeader({
    children,
    sortable = false,
    onSort,
    className = '',
    ...props
}: TableHeaderProps) {
    const baseStyles = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    const sortableStyles = sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : '';

    return (
        <th
            className={`${baseStyles} ${sortableStyles} ${className}`}
            onClick={sortable ? onSort : undefined}
            {...props}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortable && (
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z" />
                    </svg>
                )}
            </div>
        </th>
    );
}

// テーブルデータセル
export function TableCell({
    children,
    className = '',
    ...props
}: TableCellProps) {
    return (
        <td
            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
            {...props}
        >
            {children}
        </td>
    );
}