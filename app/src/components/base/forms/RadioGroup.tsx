"use client";

import { ReactNode, useId } from "react";

export interface RadioGroupProps {
    children: ReactNode;
    label?: string;
    error?: string;
    direction?: 'horizontal' | 'vertical';
    required?: boolean;
    className?: string;
    /** labelを表示しない場合に、グループ名を支援技術へ伝えるために使う */
    'aria-label'?: string;
}

export default function RadioGroup({
    children,
    label,
    error,
    direction = 'vertical',
    required = false,
    className = '',
    'aria-label': ariaLabel,
}: RadioGroupProps) {
    const reactId = useId();
    const errorId = `radiogroup-${reactId}-error`;

    const containerClasses = direction === 'horizontal'
        ? 'flex flex-wrap gap-4'
        : 'space-y-2';

    return (
        <div className={`${className}`}>
            {/*
              fieldset/legend でグループ名を伝える。
              role="radiogroup" を明示することで、支援技術に「単一選択のグループ」であることを示す。
            */}
            <fieldset
                role="radiogroup"
                aria-required={required || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                aria-label={!label ? ariaLabel : undefined}
            >
                {label && (
                    <legend className={`text-sm font-medium mb-2 ${error ? 'text-red-700' : 'text-gray-700'
                        } ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}`}>
                        {label}
                    </legend>
                )}

                {/* ラジオボタンのコンテナ */}
                <div className={containerClasses}>
                    {children}
                </div>
            </fieldset>

            {/* エラーメッセージ */}
            {error && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
