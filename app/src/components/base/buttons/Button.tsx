import { ButtonHTMLAttributes, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    /** ラベルの下に小さく添える補足（残数など）。指定すると2行表示になる */
    subLabel?: string;
    /**
     * 選択状態。指定すると選択トグルとして振る舞い、variant より優先される
     * （時間帯選択のように、複数の候補から1つ選ばせる用途で使う）
     */
    selected?: boolean;
    onclick?: () => (event?: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'light' | 'dark' | 'outline' | 'ghost';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    isDisabled?: boolean;
    isLoading?: boolean;
    /** ローディング中に表示するテキスト（未指定時はlabelのまま） */
    loadingLabel?: string;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export default function Button({
    label,
    subLabel,
    selected,
    variant = 'primary',
    size = 'md',
    isDisabled = false,
    isLoading = false,
    loadingLabel,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const variantStyles = {
        primary: `
            text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 active:scale-95
        `,
        secondary: `
            text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 active:bg-blue-900 active:scale-95
        `,
        success: `
            text-white bg-green-700 hover:bg-green-800 active:bg-blue-900 active:scale-95
        `,
        danger: `
            text-white bg-red-700 hover:bg-red-800 active:bg-blue-900 active:scale-95
        `,
        warning: `
            text-white bg-yellow-400 hover:bg-yellow-500 active:bg-blue-900 active:scale-95
        `,
        light: `
            text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 active:bg-blue-900 active:scale-95
        `,
        dark: `
            text-white bg-gray-800 hover:bg-gray-900 active:bg-blue-900 active:scale-95
        `,
        outline: `
            text-blue-700 hover:text-white border-2 border-blue-700 hover:bg-blue-800 active:bg-blue-900 active:scale-95
        `,
        ghost: `
            text-gray-500 hover:text-gray-900 border-2 hover:bg-gray-100 active:bg-blue-900 active:scale-95
        `
    };

    // サイズ別のスタイル
    const sizeStyles = {
        xs: 'px-3 py-1.5 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg'
    };

    // アイコンサイズマッピング（px）
    // lucide-react等のアイコンはsizeに数値を期待するため、文字列を渡してはいけない
    const iconSizeMapping = {
        xs: 14,
        sm: 14,
        md: 16,
        lg: 20,
        xl: 24
    };

    // 基本スタイル
    // 補足付きは2行になるため、縦並び＋高さ自動にする
    const baseStyles = `
        inline-flex ${subLabel ? 'flex-col h-auto py-3' : ''} items-center justify-center font-medium rounded-lg 
        transition-colors focus:outline-none 
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    // 選択トグルとして使う場合は見た目を選択状態から決める
    const effectiveVariant = selected === undefined
        ? variant
        : (selected ? 'primary' : 'light');

    // 幅のスタイル
    const widthStyles = fullWidth ? 'w-full' : '';

    // 最終的なクラス名を組み合わせ
    const finalClassName = [
        baseStyles,
        variantStyles[effectiveVariant],
        sizeStyles[size],
        widthStyles,
        className
    ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // アイコンにsizeプロパティを補完する関数
    // 呼び出し側がsizeやclassNameで大きさを指定している場合はそれを尊重する
    const renderIconWithSize = (icon: ReactNode) => {
        if (!icon) return null;

        if (isValidElement(icon)) {
            const element = icon as ReactElement<{ size?: number | string; className?: string }>;
            const alreadySized =
                element.props.size !== undefined ||
                /(w|h|size)-/.test(element.props.className ?? '');

            if (alreadySized) return element;

            return cloneElement(element, {
                size: iconSizeMapping[size]
            } as Partial<{ size?: number }>);
        }

        return icon;
    };

    return (
        <button
            className={finalClassName}
            disabled={disabled || isDisabled || isLoading}
            // 選択トグルとして使う場合は状態を支援技術へ伝える
            aria-pressed={selected}
            {...props}
        >
            {/* ローディングアイコン（最優先） */}
            {isLoading && (
                <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}

            {/* 左アイコン（ローディング中でない場合のみ） */}
            {!isLoading && leftIcon && (
                <span className="mr-2 flex-shrink-0 flex items-center justify-center">
                    {renderIconWithSize(leftIcon)}
                </span>
            )}

            {/* ラベル（ローディング中はloadingLabelがあればそちらを表示） */}
            <span>{isLoading && loadingLabel ? loadingLabel : label}</span>

            {/* 補足 */}
            {subLabel && <span className="text-xs font-normal">{subLabel}</span>}

            {/* 右アイコン */}
            {rightIcon && (
                <span className="ml-2 flex-shrink-0 flex items-center justify-center">
                    {renderIconWithSize(rightIcon)}
                </span>
            )}
        </button>
    );
}