"use client";

import { ChangeEvent, forwardRef, useId } from "react";

export interface CheckboxProps {
    // コンポーネント固有のプロパティ
    label?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';

    // よく使うHTML属性
    checked?: boolean;
    value?: string | number;
    disabled?: boolean;
    required?: boolean;
    name?: string;

    // イベントハンドラー
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onCheckedChange?: (checked: boolean) => void;

    // その他
    className?: string;
    id?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
    // コンポーネント固有
    label,
    error,
    size = 'md',

    // HTML属性
    // デフォルト値を持たせると、利用側がcheckedを渡していなくても
    // 常に制御コンポーネント扱いになり「onChangeの無い読み取り専用フィールド」警告が出る。
    // undefinedのまま渡して非制御コンポーネントとして動作させる。
    checked,
    value,
    disabled = false,
    required = false,
    name,

    // イベント
    onChange,
    onCheckedChange,

    // その他
    className = '',
    id,
}, ref) => {
    // IDの生成
    // Math.random()だとSSRとクライアントで値がずれてハイドレーション不整合を起こすためuseIdを使う
    const reactId = useId();
    const checkboxId = id || `checkbox-${reactId}`;
    const errorId = `${checkboxId}-error`;

    // サイズのスタイル
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const labelSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    // 変更時の処理
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
    };

    // 基本スタイル
    const baseClasses = `
    text-blue-600 bg-gray-100 border-gray-300 rounded-sm 
    focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
    focus:ring-2 dark:bg-gray-700 dark:border-gray-600
    disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${sizeClasses[size]}
    ${className}
  `.trim();

    return (
        <div className="flex items-center">
            {/* チェックボックス */}
            <input
                ref={ref}
                id={checkboxId}
                type="checkbox"
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                required={required}
                className={baseClasses}
                onChange={handleChange}
                // エラー状態と、その内容を伝えるメッセージを支援技術へ結び付ける
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
            />

            {/* ラベル */}
            {label && (
                <label
                    htmlFor={checkboxId}
                    className={`ms-2 font-medium cursor-pointer ${error ? 'text-red-700' : 'text-gray-900 dark:text-gray-300'
                        } ${disabled ? 'text-gray-400 cursor-not-allowed' : ''
                        } ${labelSizeClasses[size]} ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''
                        }`}
                >
                    {label}
                </label>
            )}

            {/* エラーメッセージ
                （旧実装は !label の時だけ表示していたため、ラベル付きだと
                  aria-describedby の参照先が存在しない状態になっていた） */}
            {error && (
                <span id={errorId} role="alert" className="ml-2 text-sm text-red-600">
                    {error}
                </span>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;