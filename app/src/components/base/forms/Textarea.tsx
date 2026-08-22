"use client";

import { ChangeEvent, forwardRef, useId } from "react";

export interface TextareaProps {
    // コンポーネント固有のプロパティ
    label?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;

    // よく使うHTML属性
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    cols?: number;
    maxLength?: number;
    minLength?: number;

    // イベントハンドラー
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;

    // その他
    className?: string;
    id?: string;
    name?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    // コンポーネント固有
    label,
    error,
    size = 'md',
    fullWidth = false,

    // HTML属性
    value,
    placeholder,
    disabled = false,
    readOnly = false,
    required = false,
    rows = 4,
    cols,
    maxLength,
    minLength,

    // イベント
    onChange,

    // その他
    className = '',
    id,
    name,
}, ref) => {
    // IDの生成
    // Math.random()だとSSRとクライアントで値がずれてハイドレーション不整合を起こすためuseIdを使う
    const reactId = useId();
    const textareaId = id || `textarea-${reactId}`;
    const errorId = `${textareaId}-error`;

    // 現在の文字数を計算
    const currentLength = String(value || '').length;

    // 文字数制限に関する状態判定
    const isNearMaxLimit = maxLength && currentLength > maxLength * 0.8;
    const isOverMaxLimit = maxLength && currentLength > maxLength;
    const isUnderMinLength = minLength && currentLength > 0 && currentLength < minLength;
    const needsMoreChars = minLength && currentLength > 0 ? minLength - currentLength : 0;

    // サイズのスタイル
    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-3 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base'
    };

    // 基本スタイル
    const baseClasses = `
        border border-gray-300 dark:border-gray-600 rounded-md 
        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 focus:border-blue-500 dark:focus:border-blue-500 
        disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
        placeholder-gray-500 dark:placeholder-gray-400
        read-only:bg-gray-50 dark:read-only:bg-gray-700 read-only:cursor-default
        resize-vertical transition-colors outline-none
        ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-800 focus:border-red-500 dark:focus:border-red-500' : ''}
        ${isUnderMinLength ? 'border-orange-400 dark:border-orange-600 focus:ring-orange-400 dark:focus:ring-orange-800 focus:border-orange-400 dark:focus:border-orange-600' : ''}
        ${isOverMaxLimit ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-800 focus:border-red-500 dark:focus:border-red-500' : ''}
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${className}
    `.trim();

    return (
        <div className={fullWidth ? 'w-full' : 'inline-block'}>
            {/* ラベル */}
            {label && (
                <label
                    htmlFor={textareaId}
                    className={`block text-sm font-medium mb-1 ${error ? 'text-red-700 dark:text-red-400' :
                        isUnderMinLength ? 'text-orange-700 dark:text-orange-400' :
                            'text-gray-700 dark:text-gray-200'
                        } ${required ? "after:content-['*'] after:text-red-500 dark:after:text-red-400 after:ml-1" : ''}`}
                >
                    {label}
                </label>
            )}

            {/* テキストエリア */}
            <textarea
                ref={ref}
                id={textareaId}
                name={name}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                rows={rows}
                cols={cols}
                maxLength={maxLength}
                minLength={minLength}
                className={baseClasses}
                onChange={onChange}
                // エラー状態と、その内容を伝えるメッセージを支援技術へ結び付ける
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
            />

            {/* フッター（エラーメッセージ、警告、文字数カウンター） */}
            <div className="mt-1">
                {/* エラーメッセージ（優先度最高） */}
                {error && (
                    <div className="flex items-center justify-between">
                        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                        {/* 文字数カウンター（エラー時） */}
                        {maxLength && (
                            <span className={`text-xs font-medium ml-2 flex-shrink-0 ${isOverMaxLimit
                                ? 'text-red-600 dark:text-red-400'
                                : isNearMaxLimit
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : isUnderMinLength
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {currentLength}/{maxLength}
                            </span>
                        )}
                    </div>
                )}

                {/* minLength警告（エラーがない場合のみ表示） */}
                {!error && isUnderMinLength && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            あと{needsMoreChars}文字必要です。
                        </p>
                        {/* 文字数カウンター（警告時） */}
                        {maxLength && (
                            <span className={`text-xs font-medium ml-2 flex-shrink-0 ${isOverMaxLimit
                                ? 'text-red-600 dark:text-red-400'
                                : isNearMaxLimit
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : isUnderMinLength
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {currentLength}/{maxLength}
                            </span>
                        )}
                    </div>
                )}

                {/* 文字数カウンター（通常時） - エラーも警告もない場合 */}
                {!error && !isUnderMinLength && maxLength && (
                    <div className="flex justify-end">
                        <span className={`text-xs font-medium ${isOverMaxLimit
                            ? 'text-red-600 dark:text-red-400'
                            : isNearMaxLimit
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {currentLength}/{maxLength}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});

Textarea.displayName = 'Textarea';