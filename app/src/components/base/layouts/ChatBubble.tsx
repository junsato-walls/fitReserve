"use client";

import Image from "next/image";
import { forwardRef, ReactNode, useState } from "react";

export interface ChatAction {
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    destructive?: boolean;
}

export interface ChatAttachment {
    id: string;
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
    size?: string;
    preview?: string;
}

export interface ChatBubbleProps {
    // 基本設定
    id?: string;
    message: string;
    user: {
        name: string;
        avatar?: string;
        avatarAlt?: string;
    };
    timestamp: string;

    // 表示設定
    position?: 'left' | 'right';
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    showAvatar?: boolean;
    showTimestamp?: boolean;
    showStatus?: boolean;

    // アクション設定
    actions?: ChatAction[];
    showActions?: boolean;

    // スタイル設定
    variant?: 'default' | 'system' | 'error';
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    // 添付ファイル
    attachments?: ChatAttachment[];

    // イベント
    onMessageClick?: () => void;
    onAvatarClick?: () => void;

    // その他
    className?: string;
}

const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(({
    id,
    message,
    user,
    timestamp,
    position = 'left',
    status = 'delivered',
    showAvatar = true,
    showTimestamp = true,
    showStatus = true,
    actions = [],
    showActions = true,
    variant = 'default',
    maxWidth = 'sm',
    attachments = [],
    onMessageClick,
    onAvatarClick,
    className = '',
}, ref) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    // デフォルトアクション
    const defaultActions: ChatAction[] = [
        {
            id: 'reply',
            label: 'Reply',
            onClick: () => console.log('Reply clicked')
        },
        {
            id: 'forward',
            label: 'Forward',
            onClick: () => console.log('Forward clicked')
        },
        {
            id: 'copy',
            label: 'Copy',
            onClick: () => console.log('Copy clicked')
        },
        {
            id: 'report',
            label: 'Report',
            onClick: () => console.log('Report clicked')
        },
        {
            id: 'delete',
            label: 'Delete',
            onClick: () => console.log('Delete clicked'),
            destructive: true
        }
    ];

    const finalActions = actions.length > 0 ? actions : defaultActions;

    // 最大幅クラス
    const getMaxWidthClasses = () => {
        const widths = {
            xs: 'max-w-[240px]',
            sm: 'max-w-[320px]',
            md: 'max-w-[400px]',
            lg: 'max-w-[480px]',
            xl: 'max-w-[560px]'
        } as const;

        return widths[maxWidth];
    };

    // バリアント別スタイル
    const getVariantClasses = () => {
        const variants = {
            default: position === 'right'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
            system: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800',
            error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        } as const;

        return variants[variant];
    };

    // 角丸クラス
    const getRoundedClasses = () => {
        if (variant !== 'default') return 'rounded-lg';

        return position === 'right'
            ? 'rounded-s-xl rounded-ee-xl rounded-es-xl'
            : 'rounded-e-xl rounded-es-xl rounded-ss-xl';
    };

    // ステータス表示
    const getStatusDisplay = () => {
        const statusMap = {
            sending: 'Sending...',
            sent: 'Sent',
            delivered: 'Delivered',
            read: 'Read'
        };

        return statusMap[status];
    };

    // ステータスアイコン
    const getStatusIcon = () => {
        switch (status) {
            case 'sending':
                return (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'sent':
                return (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'delivered':
                return (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'read':
                return (
                    <div className="flex -space-x-1">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    // 添付ファイル表示
    const renderAttachment = (attachment: ChatAttachment) => {
        switch (attachment.type) {
            case 'image':
                return (
                    <div key={attachment.id} className="mt-2 rounded-lg overflow-hidden">
                        <Image
                            src={attachment.url}
                            alt={attachment.name || 'Attachment'}
                            width={200}
                            height={150}
                            className="max-w-full h-auto"
                        />
                    </div>
                );
            case 'file':
                return (
                    <div key={attachment.id} className="mt-2 p-3 bg-white/10 rounded-lg flex items-center space-x-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            {attachment.size && (
                                <p className="text-xs opacity-75">{attachment.size}</p>
                            )}
                        </div>
                    </div>
                );
            case 'link':
                return (
                    <div key={attachment.id} className="mt-2 p-3 bg-white/10 rounded-lg">
                        <a href={attachment.url} className="text-sm underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                            {attachment.name || attachment.url}
                        </a>
                    </div>
                );
            default:
                return null;
        }
    };

    const containerClasses = position === 'right' ? 'flex-row-reverse' : 'flex-row';
    const bubbleClasses = `
    flex flex-col w-full leading-1.5 p-4 border-gray-200
    ${getMaxWidthClasses()}
    ${getVariantClasses()}
    ${getRoundedClasses()}
  `;

    return (
        <div
            ref={ref}
            id={id}
            className={`flex items-start gap-2.5 ${containerClasses} ${className}`}
        >
            {/* アバター */}
            {showAvatar && position === 'left' && (
                <button
                    onClick={onAvatarClick}
                    className="shrink-0"
                    disabled={!onAvatarClick}
                >
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={user.avatarAlt || `${user.name} avatar`}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </button>
            )}

            {/* メッセージバブル */}
            <div
                className={bubbleClasses}
                onClick={onMessageClick}
            >
                {/* ヘッダー（名前と時刻） */}
                {(position === 'left' || showTimestamp) && (
                    <div className={`flex items-center space-x-2 ${position === 'right' ? 'justify-end' : ''} rtl:space-x-reverse`}>
                        {position === 'left' && (
                            <span className={`text-sm font-semibold ${variant === 'default' ? 'text-gray-900 dark:text-white' : 'current'
                                }`}>
                                {user.name}
                            </span>
                        )}
                        {showTimestamp && (
                            <span className={`text-sm font-normal ${variant === 'default'
                                ? position === 'right'
                                    ? 'text-blue-100'
                                    : 'text-gray-500 dark:text-gray-400'
                                : 'opacity-75'
                                }`}>
                                {timestamp}
                            </span>
                        )}
                    </div>
                )}

                {/* メッセージ本文 */}
                <p className={`text-sm font-normal py-2.5 ${variant === 'default'
                    ? position === 'right'
                        ? 'text-white'
                        : 'text-gray-900 dark:text-white'
                    : 'current'
                    }`}>
                    {message}
                </p>

                {/* 添付ファイル */}
                {attachments.map(renderAttachment)}

                {/* ステータス */}
                {showStatus && position === 'right' && (
                    <div className={`flex items-center space-x-1 ${position === 'right' ? 'justify-end' : ''
                        }`}>
                        {getStatusIcon()}
                        <span className={`text-sm font-normal ${variant === 'default'
                            ? position === 'right'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            : 'opacity-75'
                            }`}>
                            {getStatusDisplay()}
                        </span>
                    </div>
                )}
            </div>

            {/* アクションメニュー */}
            {showActions && finalActions.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setIsActionsOpen(!isActionsOpen)}
                        className="inline-flex self-center items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
                        type="button"
                    >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                            <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>
                    </button>

                    {/* ドロップダウンメニュー */}
                    {isActionsOpen && (
                        <>
                            {/* オーバーレイ */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsActionsOpen(false)}
                            />

                            {/* メニュー */}
                            <div className={`
                absolute z-20 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-40 dark:bg-gray-700 dark:divide-gray-600
                ${position === 'right' ? 'right-0' : 'left-0'}
                top-full mt-1
              `}>
                                <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                                    {finalActions.map((action) => (
                                        <li key={action.id}>
                                            <button
                                                onClick={() => {
                                                    action.onClick();
                                                    setIsActionsOpen(false);
                                                }}
                                                className={`
                          w-full text-left flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white
                          ${action.destructive ? 'text-red-600 dark:text-red-400' : ''}
                        `}
                                            >
                                                {action.icon && (
                                                    <span className="mr-2">
                                                        {action.icon}
                                                    </span>
                                                )}
                                                {action.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 右側のアバター */}
            {showAvatar && position === 'right' && (
                <button
                    onClick={onAvatarClick}
                    className="shrink-0"
                    disabled={!onAvatarClick}
                >
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={user.avatarAlt || `${user.name} avatar`}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </button>
            )}
        </div>
    );
});

ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;