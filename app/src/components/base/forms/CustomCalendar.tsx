"use client";

import {
    ChangeEvent,
    forwardRef,
    KeyboardEvent,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";

export interface CustomCalendarProps {
    // 値（yyyy-mm-dd 形式の文字列）
    value: string;
    onChange: (value: string) => void;

    // 表示
    label?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;

    // スタイル
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
    calendarClassName?: string;

    // 状態
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;

    // その他
    id?: string;
    name?: string;
    'aria-label'?: string;
}

/** 選択できる年の範囲 */
const MIN_YEAR = 1980;
const MAX_YEAR = 9999;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 曜日ごとの文字色（日曜=赤・土曜=青） */
const WEEKDAY_TONE = [
    'text-red-500',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-blue-500',
];

const pad = (value: number): string => String(value).padStart(2, '0');

/** 年月日から yyyy-mm-dd 形式の文字列を作る */
const toValue = (year: number, month: number, day: number): string =>
    `${year}-${pad(month)}-${pad(day)}`;

interface ParsedDate {
    year: number;
    month: number;
    day: number;
}

/**
 * yyyy-mm-dd 形式の文字列を解析する。解析できない場合は null を返す。
 *
 * new Date(文字列) は "2024-2-31" のような値も受け付けてしまい入力途中の判定に
 * 使えないため、書式と実在チェックを自前で行う。
 */
function parseValue(value: string): ParsedDate | null {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!matched) return null;

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);

    if (year < MIN_YEAR || year > MAX_YEAR) return null;

    // 2月30日のような存在しない日付を弾く
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return { year, month, day };
}

/** 指定年月の日数 */
const getDaysInMonth = (year: number, month: number): number =>
    new Date(year, month, 0).getDate();

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
};

/**
 * 日付を入力・選択するためのカレンダー付きテキストボックス
 *
 * 直接の文字入力とカレンダーからの選択の両方に対応する。
 * DOMフォーカスは常にテキストボックスに留めたまま aria-activedescendant で
 * カレンダー上の位置を伝えるため、入力しながらキーボード操作ができる。
 */
const CustomCalendar = forwardRef<HTMLInputElement, CustomCalendarProps>(({
    value,
    onChange,
    label,
    placeholder = 'yyyy-mm-dd',
    error,
    helperText,
    size = 'md',
    fullWidth = false,
    className = '',
    calendarClassName = '',
    disabled = false,
    readOnly = false,
    required = false,
    id,
    name,
    'aria-label': ariaLabel,
}, ref) => {
    // IDの生成
    // Math.random()だとSSRとクライアントで値がずれてハイドレーション不整合を起こすためuseIdを使う
    const reactId = useId();
    const baseId = id || `calendar-${reactId}`;
    const dialogId = `${baseId}-dialog`;
    const gridId = `${baseId}-grid`;
    const errorId = `${baseId}-error`;
    const helperId = `${baseId}-helper`;

    const [isOpen, setIsOpen] = useState(false);
    // カレンダーが表示している年月
    const [view, setView] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    });
    // キーボードで現在ハイライトしている日（nullはハイライト無し）
    const [activeDay, setActiveDay] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const parsed = useMemo(() => parseValue(value ?? ''), [value]);

    // 外部から渡されたrefと内部refの両方に実体を渡す
    const setRefs = useCallback((node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    const openCalendar = useCallback(() => {
        if (disabled || readOnly) return;

        const current = parseValue(value ?? '');
        const now = new Date();

        // 入力済みならその年月、未入力なら当月を表示する
        setView(
            current
                ? { year: current.year, month: current.month }
                : { year: now.getFullYear(), month: now.getMonth() + 1 }
        );
        setActiveDay(current ? current.day : now.getDate());
        setIsOpen(true);
    }, [disabled, readOnly, value]);

    const closeCalendar = useCallback((returnFocus = true) => {
        setIsOpen(false);
        setActiveDay(null);
        if (returnFocus) inputRef.current?.focus();
    }, []);

    /**
     * カレンダー外クリックで閉じる
     */
    useEffect(() => {
        if (!isOpen) return;

        function handleMouseDown(event: MouseEvent) {
            if (containerRef.current?.contains(event.target as Node)) return;
            // フォーカスはクリック先へ移るため戻さない
            setIsOpen(false);
            setActiveDay(null);
        }

        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [isOpen]);

    /**
     * 月を移動した結果ハイライト位置が月末を超えた場合は月末に寄せる
     * （1/31 から 2月へ移動した場合など）
     */
    useEffect(() => {
        if (activeDay === null) return;
        const lastDay = getDaysInMonth(view.year, view.month);
        if (activeDay > lastDay) setActiveDay(lastDay);
    }, [view, activeDay]);

    /** 表示月を前後に動かす */
    const shiftMonth = useCallback((direction: -1 | 1) => {
        setView((prev) => {
            let year = prev.year;
            let month = prev.month + direction;

            if (month < 1) {
                month = 12;
                year--;
            } else if (month > 12) {
                month = 1;
                year++;
            }

            // 範囲外なら移動しない
            if (year < MIN_YEAR || year > MAX_YEAR) return prev;
            return { year, month };
        });
    }, []);

    /** ハイライト位置を日数単位で動かす（月をまたぐ場合は表示月も動かす） */
    const moveActiveDay = useCallback((delta: number) => {
        const base = activeDay ?? parsed?.day ?? 1;
        const moved = new Date(view.year, view.month - 1, base + delta);

        if (moved.getFullYear() < MIN_YEAR || moved.getFullYear() > MAX_YEAR) return;

        setView({ year: moved.getFullYear(), month: moved.getMonth() + 1 });
        setActiveDay(moved.getDate());
    }, [activeDay, parsed, view]);

    const selectDay = useCallback((year: number, month: number, day: number) => {
        onChange(toValue(year, month, day));
        closeCalendar();
    }, [onChange, closeCalendar]);

    const selectToday = useCallback(() => {
        const now = new Date();
        onChange(toValue(now.getFullYear(), now.getMonth() + 1, now.getDate()));
        closeCalendar();
    }, [onChange, closeCalendar]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        onChange(nextValue);

        // 入力が日付として成立した時点でカレンダーの表示月を合わせる
        const nextParsed = parseValue(nextValue);
        if (nextParsed) {
            setView({ year: nextParsed.year, month: nextParsed.month });
            setActiveDay(nextParsed.day);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return;

        switch (event.key) {
            case 'Escape':
                if (isOpen) {
                    event.preventDefault();
                    closeCalendar();
                }
                return;

            case 'Enter':
                if (isOpen && activeDay !== null) {
                    event.preventDefault();
                    selectDay(view.year, view.month, activeDay);
                }
                return;

            case 'ArrowDown':
            case 'ArrowUp':
            case 'ArrowLeft':
            case 'ArrowRight': {
                event.preventDefault();
                if (!isOpen) {
                    openCalendar();
                    return;
                }
                const delta =
                    event.key === 'ArrowDown' ? 7
                        : event.key === 'ArrowUp' ? -7
                            : event.key === 'ArrowRight' ? 1
                                : -1;
                moveActiveDay(delta);
                return;
            }

            // 月の移動はテキスト入力と衝突しないPageUp/PageDownに割り当てる
            case 'PageUp':
                if (isOpen) {
                    event.preventDefault();
                    shiftMonth(-1);
                }
                return;

            case 'PageDown':
                if (isOpen) {
                    event.preventDefault();
                    shiftMonth(1);
                }
                return;

            default:
        }
    };

    // 週ごとの配列を作る（月初までの空白はnull）
    const weeks = useMemo(() => {
        const daysInMonth = getDaysInMonth(view.year, view.month);
        const firstWeekday = new Date(view.year, view.month - 1, 1).getDay();

        const cells: (number | null)[] = [
            ...Array.from({ length: firstWeekday }, () => null),
            ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
        ];

        const result: (number | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            result.push(cells.slice(i, i + 7));
        }
        return result;
    }, [view]);

    const inputClasses = `
        border border-gray-300 rounded-md
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
        read-only:bg-gray-50 read-only:cursor-default
        transition-colors outline-none
        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        ${fullWidth ? 'w-full' : 'w-40'}
        ${sizeClasses[size]}
        ${className}
    `.trim();

    // 当日・選択日の判定。カレンダーを開いている間だけ使う
    const now = new Date();
    const isToday = (day: number) =>
        now.getFullYear() === view.year &&
        now.getMonth() + 1 === view.month &&
        now.getDate() === day;
    const isSelected = (day: number) =>
        parsed !== null &&
        parsed.year === view.year &&
        parsed.month === view.month &&
        parsed.day === day;

    const navButtonClasses =
        'flex h-7 w-9 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300';

    return (
        <div className={fullWidth ? 'w-full' : 'inline-block'}>
            {/* ラベル */}
            {label && (
                <label
                    htmlFor={baseId}
                    className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'
                        } ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}`}
                >
                    {label}
                </label>
            )}

            <div ref={containerRef} className="relative">
                {/* 日付テキストボックス */}
                <input
                    ref={setRefs}
                    id={baseId}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={value ?? ''}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    className={inputClasses}
                    onChange={handleInputChange}
                    onFocus={openCalendar}
                    onClick={openCalendar}
                    onKeyDown={handleKeyDown}
                    // 日付選択ダイアログを開くコンボボックスとして支援技術へ伝える
                    role="combobox"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? dialogId : undefined}
                    aria-activedescendant={
                        isOpen && activeDay !== null ? `${gridId}-day-${activeDay}` : undefined
                    }
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : helperText ? helperId : undefined}
                    aria-label={ariaLabel}
                />

                {/* カレンダー */}
                {isOpen && (
                    <div
                        id={dialogId}
                        role="dialog"
                        aria-label={`${view.year}年${view.month}月のカレンダー`}
                        className={`absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg ${calendarClassName}`}
                        // カレンダー内の操作でテキストボックスからフォーカスを奪わない
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        {/* ヘッダ */}
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label="前の月"
                                className={navButtonClasses}
                                disabled={view.year === MIN_YEAR && view.month === 1}
                                onClick={() => shiftMonth(-1)}
                            >
                                &lt;
                            </button>

                            <div className="flex items-baseline gap-1 font-medium text-gray-800">
                                <span>{view.year}年</span>
                                <span className="w-8 text-right">{view.month}月</span>
                            </div>

                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label="次の月"
                                className={navButtonClasses}
                                disabled={view.year === MAX_YEAR && view.month === 12}
                                onClick={() => shiftMonth(1)}
                            >
                                &gt;
                            </button>

                            <button
                                type="button"
                                tabIndex={-1}
                                className="flex h-7 items-center justify-center rounded-full bg-gray-800 px-3 text-xs font-bold text-white transition-colors hover:bg-gray-700"
                                onClick={selectToday}
                            >
                                今日
                            </button>
                        </div>

                        {/* 日にち */}
                        <div id={gridId} role="grid" aria-label="日付">
                            {/* 曜日 */}
                            <div role="row" className="grid grid-cols-7 gap-y-1">
                                {WEEKDAYS.map((weekday, index) => (
                                    <div
                                        key={weekday}
                                        role="columnheader"
                                        aria-label={`${weekday}曜日`}
                                        className={`flex h-8 items-center justify-center text-xs font-bold ${WEEKDAY_TONE[index]}`}
                                    >
                                        {weekday}
                                    </div>
                                ))}
                            </div>

                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} role="row" className="grid grid-cols-7 gap-y-1">
                                    {week.map((day, dayIndex) => {
                                        if (day === null) {
                                            return (
                                                <div
                                                    key={`blank-${dayIndex}`}
                                                    role="gridcell"
                                                    aria-hidden="true"
                                                    className="h-8"
                                                />
                                            );
                                        }

                                        const selected = isSelected(day);
                                        const today = isToday(day);
                                        const active = activeDay === day;

                                        return (
                                            <div
                                                key={day}
                                                id={`${gridId}-day-${day}`}
                                                role="gridcell"
                                                aria-selected={selected}
                                                className={[
                                                    'mx-auto flex h-8 w-8 cursor-pointer select-none items-center',
                                                    'justify-center rounded-full text-sm transition-colors',
                                                    selected
                                                        ? 'bg-blue-600 font-semibold text-white'
                                                        : today
                                                            ? 'bg-green-100 font-semibold text-green-800'
                                                            : 'text-gray-700 hover:bg-gray-100',
                                                    active ? 'ring-2 ring-blue-500' : '',
                                                ].join(' ')}
                                                onClick={() => selectDay(view.year, view.month, day)}
                                            >
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* エラー・補助テキスト */}
            {error && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p id={helperId} className="mt-1 text-sm text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

CustomCalendar.displayName = 'CustomCalendar';

export default CustomCalendar;
