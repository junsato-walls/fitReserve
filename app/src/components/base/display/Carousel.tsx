"use client";

import Image from "next/image";
import { forwardRef, ReactNode, useCallback, useEffect, useState } from "react";

export interface CarouselItem {
    id: string;
    src: string;
    alt: string;
    title?: string;
    description?: string;
    href?: string;
    content?: ReactNode;
}

export interface CarouselProps {
    // 基本設定
    items: CarouselItem[];

    // 表示設定
    height?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
    autoPlay?: boolean;
    autoPlayInterval?: number;
    loop?: boolean;

    // 制御設定
    showIndicators?: boolean;
    showControls?: boolean;
    pauseOnHover?: boolean;

    // スタイル設定
    indicatorPosition?: 'bottom' | 'top';
    indicatorStyle?: 'dots' | 'lines' | 'thumbnails';
    transition?: 'slide' | 'fade';

    // Next.js Image props
    priority?: boolean;
    quality?: number;
    fill?: boolean;

    // イベント
    onSlideChange?: (index: number) => void;
    onItemClick?: (item: CarouselItem, index: number) => void;

    // その他
    className?: string;
    initialSlide?: number;
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(({
    items,
    height = 'md',
    autoPlay = false,
    autoPlayInterval = 5000,
    loop = true,
    showIndicators = true,
    showControls = true,
    pauseOnHover = true,
    indicatorPosition = 'bottom',
    indicatorStyle = 'dots',
    transition = 'slide',
    priority = false,
    quality = 75,
    fill = true,
    onSlideChange,
    onItemClick,
    className = '',
    initialSlide = 0,
}, ref) => {
    const [currentIndex, setCurrentIndex] = useState(initialSlide);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // 高さクラス
    const getHeightClasses = () => {
        if (height === 'auto') return 'h-auto';

        const heights = {
            sm: 'h-48 md:h-64',
            md: 'h-56 md:h-96',
            lg: 'h-64 md:h-[32rem]',
            xl: 'h-80 md:h-[40rem]'
        } as const;

        return heights[height];
    };

    // 次のスライドに移動
    const goToNext = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 700);

        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= items.length) {
                return loop ? 0 : prevIndex;
            }
            return nextIndex;
        });
    }, [items.length, loop, isTransitioning]);

    // 前のスライドに移動
    const goToPrevious = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 700);

        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex - 1;
            if (nextIndex < 0) {
                return loop ? items.length - 1 : prevIndex;
            }
            return nextIndex;
        });
    }, [items.length, loop, isTransitioning]);

    // 指定したスライドに移動
    const goToSlide = useCallback((index: number) => {
        if (isTransitioning || index === currentIndex) return;

        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 700);
        setCurrentIndex(index);
    }, [currentIndex, isTransitioning]);

    // 自動再生
    useEffect(() => {
        if (!isPlaying || !autoPlay) return;

        const interval = setInterval(() => {
            goToNext();
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [isPlaying, autoPlay, autoPlayInterval, goToNext]);

    // スライド変更イベント
    useEffect(() => {
        onSlideChange?.(currentIndex);
    }, [currentIndex, onSlideChange]);

    // ホバー時の一時停止
    const handleMouseEnter = () => {
        if (pauseOnHover) {
            setIsPlaying(false);
        }
    };

    const handleMouseLeave = () => {
        if (pauseOnHover && autoPlay) {
            setIsPlaying(true);
        }
    };

    // アイテムクリック
    const handleItemClick = (item: CarouselItem, index: number) => {
        if (item.href) {
            window.location.href = item.href;
        }
        onItemClick?.(item, index);
    };

    // キーボードナビゲーション
    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                goToPrevious();
                break;
            case 'ArrowRight':
                event.preventDefault();
                goToNext();
                break;
            case ' ':
                event.preventDefault();
                setIsPlaying(!isPlaying);
                break;
        }
    };

    // インジケーターのスタイル
    const getIndicatorClasses = (index: number) => {
        const baseClasses = "transition-all duration-300";
        const isActive = index === currentIndex;

        switch (indicatorStyle) {
            case 'dots':
                return `${baseClasses} w-3 h-3 rounded-full ${isActive
                    ? 'bg-white dark:bg-gray-300'
                    : 'bg-white/50 dark:bg-gray-600 hover:bg-white/75 dark:hover:bg-gray-400'
                    }`;
            case 'lines':
                return `${baseClasses} h-1 rounded ${isActive
                    ? 'w-8 bg-white dark:bg-gray-300'
                    : 'w-4 bg-white/50 dark:bg-gray-600 hover:bg-white/75 dark:hover:bg-gray-400'
                    }`;
            case 'thumbnails':
                return `${baseClasses} w-12 h-8 rounded border-2 overflow-hidden ${isActive
                    ? 'border-white dark:border-gray-300'
                    : 'border-white/50 dark:border-gray-600 hover:border-white/75 dark:hover:border-gray-400'
                    }`;
            default:
                return baseClasses;
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className={`${getHeightClasses()} bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center ${className}`}>
                <p className="text-gray-500 dark:text-gray-400">No items to display</p>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`relative w-full ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Carousel wrapper */}
            <div className={`relative ${getHeightClasses()} overflow-hidden rounded-lg`}>
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`
              absolute inset-0 duration-700 ease-in-out
              ${transition === 'fade'
                                ? (index === currentIndex ? 'opacity-100' : 'opacity-0')
                                : (index === currentIndex ? 'translate-x-0' : index < currentIndex ? '-translate-x-full' : 'translate-x-full')
                            }
              ${item.href || onItemClick ? 'cursor-pointer' : ''}
            `}
                        onClick={() => handleItemClick(item, index)}
                    >
                        {item.content ? (
                            <div className="w-full h-full flex items-center justify-center">
                                {item.content}
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                {fill ? (
                                    <Image
                                        src={item.src}
                                        alt={item.alt}
                                        fill
                                        priority={priority && index === 0}
                                        quality={quality}
                                        className="object-cover"
                                    />
                                ) : (
                                    <Image
                                        src={item.src}
                                        alt={item.alt}
                                        width={800}
                                        height={400}
                                        priority={priority && index === 0}
                                        quality={quality}
                                        className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 object-cover"
                                    />
                                )}

                                {/* オーバーレイコンテンツ */}
                                {(item.title || item.description) && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                                        {item.title && (
                                            <h3 className="text-white text-xl font-bold mb-2">
                                                {item.title}
                                            </h3>
                                        )}
                                        {item.description && (
                                            <p className="text-white/90 text-sm">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* インジケーター */}
            {showIndicators && (
                <div className={`
          absolute z-30 flex -translate-x-1/2 left-1/2 space-x-3 rtl:space-x-reverse
          ${indicatorPosition === 'bottom' ? 'bottom-5' : 'top-5'}
        `}>
                    {items.map((item, index) => (
                        <button
                            key={`indicator-${item.id}`}
                            type="button"
                            onClick={() => goToSlide(index)}
                            className={getIndicatorClasses(index)}
                            aria-current={index === currentIndex}
                            aria-label={`Slide ${index + 1}`}
                        >
                            {indicatorStyle === 'thumbnails' && (
                                <Image
                                    src={item.src}
                                    alt={item.alt}
                                    width={48}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* 制御ボタン */}
            {showControls && items.length > 1 && (
                <>
                    {/* 前へボタン */}
                    <button
                        type="button"
                        onClick={goToPrevious}
                        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                        disabled={!loop && currentIndex === 0}
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none group-disabled:opacity-50 group-disabled:cursor-not-allowed">
                            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
                            </svg>
                            <span className="sr-only">Previous</span>
                        </span>
                    </button>

                    {/* 次へボタン */}
                    <button
                        type="button"
                        onClick={goToNext}
                        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                        disabled={!loop && currentIndex === items.length - 1}
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none group-disabled:opacity-50 group-disabled:cursor-not-allowed">
                            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="sr-only">Next</span>
                        </span>
                    </button>
                </>
            )}

            {/* 再生/一時停止ボタン（オプション） */}
            {autoPlay && (
                <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
});

Carousel.displayName = 'Carousel';