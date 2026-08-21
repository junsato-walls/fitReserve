"use client";

import Image from "next/image";
import { forwardRef, useState } from "react";

export interface AvatarProps {
    // 基本設定
    src?: string;
    alt?: string;
    fallback?: string;

    // サイズ設定
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

    // スタイル設定
    shape?: 'circle' | 'square' | 'rounded';
    variant?: 'default' | 'ring' | 'bordered' | 'shadow';

    // ステータス表示
    status?: 'online' | 'offline' | 'away' | 'busy';
    showStatus?: boolean;

    // フォールバック設定
    showInitials?: boolean;
    name?: string;

    // カスタムスタイル
    className?: string;
    statusClassName?: string;

    // Next.js Image props
    priority?: boolean;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;

    // イベント
    onError?: () => void;
    onLoad?: () => void;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({
    src,
    alt,
    fallback,
    size = 'md',
    shape = 'circle',
    variant = 'default',
    status,
    showStatus = false,
    showInitials = true,
    name = '',
    className = '',
    statusClassName = '',
    priority = false,
    quality = 75,
    placeholder = 'empty',
    blurDataURL,
    onError,
    onLoad,
}, ref) => {
    const [imageError, setImageError] = useState(false);

    // サイズクラス
    const getSizeClasses = () => {
        if (typeof size === 'number') {
            return {
                container: '',
                status: 'w-3 h-3',
                text: 'text-base',
                style: { width: `${size}px`, height: `${size}px` },
                imageSize: size
            };
        }

        const sizeClasses = {
            xs: {
                container: 'w-6 h-6',
                status: 'w-2 h-2',
                text: 'text-xs',
                imageSize: 24
            },
            sm: {
                container: 'w-8 h-8',
                status: 'w-2.5 h-2.5',
                text: 'text-sm',
                imageSize: 32
            },
            md: {
                container: 'w-10 h-10',
                status: 'w-3 h-3',
                text: 'text-base',
                imageSize: 40
            },
            lg: {
                container: 'w-12 h-12',
                status: 'w-3.5 h-3.5',
                text: 'text-lg',
                imageSize: 48
            },
            xl: {
                container: 'w-16 h-16',
                status: 'w-4 h-4',
                text: 'text-xl',
                imageSize: 64
            },
            '2xl': {
                container: 'w-20 h-20',
                status: 'w-5 h-5',
                text: 'text-2xl',
                imageSize: 80
            }
        } as const;

        return {
            ...sizeClasses[size],
            style: {}
        };
    };

    // 形状クラス
    const getShapeClasses = () => {
        switch (shape) {
            case 'circle':
                return 'rounded-full';
            case 'square':
                return '';
            case 'rounded':
                return 'rounded-lg';
            default:
                return 'rounded-full';
        }
    };

    // バリアントクラス
    const getVariantClasses = () => {
        switch (variant) {
            case 'ring':
                return 'ring-2 ring-white dark:ring-gray-800';
            case 'bordered':
                return 'border-2 border-gray-200 dark:border-gray-700';
            case 'shadow':
                return 'shadow-lg';
            default:
                return '';
        }
    };

    // ステータスクラス
    const getStatusClasses = () => {
        if (!status) return '';

        const statusClasses = {
            online: 'bg-green-400',
            offline: 'bg-gray-400',
            away: 'bg-yellow-400',
            busy: 'bg-red-400'
        } as const;

        return `${statusClasses[status]} border-2 border-white dark:border-gray-800`;
    };

    // イニシャルを取得
    const getInitials = () => {
        if (!name) return fallback || '?';

        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // イニシャルの背景色を生成
    const getInitialsBackgroundColor = () => {
        if (!name) return 'bg-gray-500';

        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ] as const;

        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    // エラーハンドリング
    const handleError = () => {
        setImageError(true);
        onError?.();
    };

    // ロードハンドリング
    const handleLoad = () => {
        onLoad?.();
    };

    const sizeClasses = getSizeClasses();
    const shapeClasses = getShapeClasses();
    const variantClasses = getVariantClasses();
    const statusClasses = getStatusClasses();

    const shouldShowImage = src && !imageError;
    const shouldShowInitials = !shouldShowImage && showInitials;
    const shouldShowFallback = !shouldShowImage && !shouldShowInitials && fallback;

    return (
        <div
            ref={ref}
            className={`relative inline-flex items-center justify-center ${sizeClasses.container}`}
            style={sizeClasses.style}
        >
            {/* 画像表示 */}
            {shouldShowImage && (
                <div className={`overflow-hidden ${shapeClasses} ${variantClasses}`}>
                    <Image
                        src={src}
                        alt={alt || name || 'Avatar'}
                        width={sizeClasses.imageSize}
                        height={sizeClasses.imageSize}
                        onError={handleError}
                        onLoad={handleLoad}
                        priority={priority}
                        quality={quality}
                        placeholder={placeholder}
                        blurDataURL={blurDataURL}
                        className={`object-cover ${className}`}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </div>
            )}

            {/* イニシャル表示 */}
            {shouldShowInitials && (
                <div
                    className={`
                        flex items-center justify-center text-white font-medium
                        ${sizeClasses.container}
                        ${sizeClasses.text}
                        ${shapeClasses}
                        ${variantClasses}
                        ${getInitialsBackgroundColor()}
                        ${className}
                    `}
                    style={sizeClasses.style}
                >
                    {getInitials()}
                </div>
            )}

            {/* フォールバック表示 */}
            {shouldShowFallback && (
                <div
                    className={`
                        flex items-center justify-center bg-gray-300 text-gray-600 font-medium
                        ${sizeClasses.container}
                        ${sizeClasses.text}
                        ${shapeClasses}
                        ${variantClasses}
                        ${className}
                    `}
                    style={sizeClasses.style}
                >
                    {fallback}
                </div>
            )}

            {/* ステータス表示 */}
            {showStatus && status && (
                <span
                    className={`
                        absolute bottom-0 right-0 rounded-full
                        ${sizeClasses.status}
                        ${statusClasses}
                        ${statusClassName}
                    `}
                />
            )}
        </div>
    );
});

Avatar.displayName = 'Avatar';

export default Avatar;