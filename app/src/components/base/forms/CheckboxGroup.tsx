"use client";

import { ReactNode, useId } from "react";

export interface CheckboxGroupProps {
    children: ReactNode;
    label?: string;
    error?: string;
    direction?: 'horizontal' | 'vertical';
    required?: boolean;
    className?: string;
    /** labelを表示しない場合に、グループ名を支援技術へ伝えるために使う */
    'aria-label'?: string;
}

export const CheckboxGroup = ({
    children,
    label,
    error,
    direction = 'vertical',
    required = false,
    className = '',
    'aria-label': ariaLabel,
}: CheckboxGroupProps) => {
    const reactId = useId();
    const errorId = `checkboxgroup-${reactId}-error`;

    const containerClasses = direction === 'horizontal'
        ? 'flex flex-wrap gap-4'
        : 'space-y-3';

    return (
        <div className={className}>
            {/*
              fieldset/legend でグループ名を伝える。
              複数選択可のため role="group" を使う（単一選択のRadioGroupはradiogroup）。
            */}
            {/* role="group" は aria-invalid / aria-required をサポートしないため、
                必須はlegendの視覚表現、エラーは aria-describedby で伝える
                （個々のcheckboxのrequired属性はCheckbox側で扱う） */}
            <fieldset
                role="group"
                aria-describedby={error ? errorId : undefined}
                aria-label={!label ? ariaLabel : undefined}
            >
                {label && (
                    <legend className={`text-sm font-medium mb-3 ${error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                        } ${required ? "after:content-['*'] after:text-red-500 dark:after:text-red-400 after:ml-1" : ''}`}>
                        {label}
                    </legend>
                )}

                {/* チェックボックスのコンテナ */}
                <div className={containerClasses}>
                    {children}
                </div>
            </fieldset>

            {/* エラーメッセージ */}
            {error && (
                <p id={errorId} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
