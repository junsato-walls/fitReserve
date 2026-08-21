"use client";

import { ChangeEvent, forwardRef, useId } from "react";

export interface FileInputProps {
    // コンポーネント固有のプロパティ
    label?: string;
    error?: string;
    fullWidth?: boolean;

    // よく使うHTML属性
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    required?: boolean;

    // イベントハンドラー
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onFilesChange?: (files: FileList | null) => void;

    // その他
    className?: string;
    id?: string;
    name?: string;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(({
    // コンポーネント固有
    label,
    error,
    fullWidth = true,

    // HTML属性
    accept,
    multiple = false,
    disabled = false,
    required = false,

    // イベント
    onChange,
    onFilesChange,

    // その他
    className = '',
    id,
    name,
}, ref) => {
    // IDの生成
    // Math.random()だとSSRとクライアントで値がずれてハイドレーション不整合を起こすためuseIdを使う
    const reactId = useId();
    const fileInputId = id || `file_input-${reactId}`;
    const errorId = `${fileInputId}-error`;

    // ファイル変更時の処理
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        onFilesChange?.(event.target.files);
    };

    // 基本スタイル
    const baseClasses = `
    block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer 
    bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 
    dark:border-gray-600 dark:placeholder-gray-400
    file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 
    file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 
    file:cursor-pointer hover:file:bg-blue-100 dark:file:bg-gray-600 
    dark:file:text-gray-300 dark:hover:file:bg-gray-500
    disabled:cursor-not-allowed disabled:opacity-50
    ${error ? 'border-red-500 focus:border-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

    return (
        <div className={fullWidth ? 'w-full' : 'inline-block'}>
            {/* ラベル */}
            {label && (
                <label
                    htmlFor={fileInputId}
                    className={`block mb-2 text-sm font-medium ${error ? 'text-red-700' : 'text-gray-900 dark:text-white'
                        } ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}`}
                >
                    {label}
                </label>
            )}

            {/* ファイル入力 */}
            <input
                ref={ref}
                id={fileInputId}
                name={name}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                required={required}
                className={baseClasses}
                onChange={handleChange}
                // エラー状態と、その内容を伝えるメッセージを支援技術へ結び付ける
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
            />

            {/* エラーメッセージ */}
            {error && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
});

FileInput.displayName = 'FileInput';

export default FileInput;