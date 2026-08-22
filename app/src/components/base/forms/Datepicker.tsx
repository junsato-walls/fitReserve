"use client";

import { ChangeEvent, FocusEvent, forwardRef, InputHTMLAttributes, KeyboardEvent, MouseEvent, useEffect, useId, useMemo, useRef, useState } from "react";

export interface DateChangeEvent {
    date: Date | null;
    formattedDate: string;
    originalEvent?: ChangeEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>;
}

export interface DatepickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'defaultValue' | 'onFocus' | 'onBlur'> {
    // 値の設定
    value?: Date | string | null;
    defaultValue?: Date | string | null;

    // フォーマット設定
    dateFormat?: string; // 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY' など
    displayFormat?: string; // 表示用フォーマット

    // 制限設定
    minDate?: Date | string;
    maxDate?: Date | string;
    disabledDates?: (Date | string)[];
    disabledDaysOfWeek?: number[]; // 0=日曜日, 1=月曜日, ...
    /**
     * 選択できる日付のホワイトリスト。
     * 指定した場合、ここに無い日付はすべて選択不可になる（予約枠のある日だけ選ばせる用途）。
     */
    availableDates?: (Date | string)[];

    // UI設定
    label?: string;
    /** ラベルの下に出す補足説明 */
    helperText?: string;
    /** 入力欄を出さず、カレンダーを常時表示する */
    inline?: boolean;
    placeholder?: string;
    showIcon?: boolean;
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    error?: string;

    // 動作設定
    closeOnSelect?: boolean;
    clearable?: boolean;
    readonly?: boolean;

    // イベント
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
    /** 表示月が変わったとき。その月の空き状況を取り直す用途で使う */
    onMonthChange?: (month: Date) => void;

    // その他
    className?: string;
    containerClassName?: string;
}

export const Datepicker = forwardRef<HTMLInputElement, DatepickerProps>(({
    value,
    defaultValue,
    dateFormat = 'YYYY-MM-DD',
    displayFormat,
    minDate,
    maxDate,
    disabledDates = [],
    disabledDaysOfWeek = [],
    availableDates,
    label,
    helperText,
    inline = false,
    placeholder = "日付を選択",
    showIcon = true,
    icon,
    size = 'md',
    error,
    closeOnSelect = true,
    clearable = false,
    readonly = false,
    onChange,
    onFocus,
    onBlur,
    onMonthChange,
    className = '',
    containerClassName = '',
    disabled,
    ...props
}, ref) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        if (value) return typeof value === 'string' ? new Date(value) : value;
        if (defaultValue) return typeof defaultValue === 'string' ? new Date(defaultValue) : defaultValue;
        return null;
    });

    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [inputValue, setInputValue] = useState('');
    // キーボードで移動中の日付（DOMフォーカスは入力欄に残したまま位置だけを追う）
    const [activeDate, setActiveDate] = useState<Date | null>(null);

    const reactId = useId();
    const baseId = `datepicker-${reactId}`;
    const dialogId = `${baseId}-dialog`;
    const errorId = `${baseId}-error`;
    /** 日付セルのidを日付から一意に決める */
    const getDayId = (date: Date) =>
        `${baseId}-day-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // サイズ別スタイル
    const sizeClasses = {
        sm: {
            input: 'text-xs p-2 ps-8',
            icon: 'ps-2.5',
            iconSize: 'w-3 h-3',
        },
        md: {
            input: 'text-sm p-2.5 ps-10',
            icon: 'ps-3.5',
            iconSize: 'w-4 h-4',
        },
        lg: {
            input: 'text-base p-3 ps-12',
            icon: 'ps-4',
            iconSize: 'w-5 h-5',
        },
    };

    // デフォルトアイコン
    const defaultIcon = (
        <svg
            className={`${sizeClasses[size].iconSize} text-gray-500 dark:text-gray-400`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
        </svg>
    );

    // 日付フォーマット関数
    const formatDate = (date: Date, format: string): string => {
        if (!date || isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day);
    };

    // 日付パース関数
    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    // 入力値の更新
    useEffect(() => {
        if (selectedDate) {
            const format = displayFormat || dateFormat;
            setInputValue(formatDate(selectedDate, format));
        } else {
            setInputValue('');
        }
    }, [selectedDate, dateFormat, displayFormat]);

    // 外部クリック検知
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // カレンダーの日付生成
    const generateCalendarDays = () => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    // 日付が無効かチェック
    const isDateDisabled = (date: Date): boolean => {
        // 時刻を落として日付単位で比較する
        // （そうしないと minDate に「今」を渡したとき当日が選べなくなる）
        const toDayStart = (value: Date) =>
            new Date(value.getFullYear(), value.getMonth(), value.getDate());

        const target = toDayStart(date);
        const min = minDate ? toDayStart(typeof minDate === 'string' ? new Date(minDate) : minDate) : null;
        const max = maxDate ? toDayStart(typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : null;

        if (min && target < min) return true;
        if (max && target > max) return true;
        // ホワイトリストが指定されている場合、そこに無い日付は選べない
        if (availableDates && !availableDates.some(availableDate => {
            const available = typeof availableDate === 'string' ? new Date(availableDate) : availableDate;
            return date.toDateString() === available.toDateString();
        })) return true;
        if (disabledDaysOfWeek.includes(date.getDay())) return true;
        if (disabledDates.some(disabledDate => {
            const disabled = typeof disabledDate === 'string' ? new Date(disabledDate) : disabledDate;
            return date.toDateString() === disabled.toDateString();
        })) return true;

        return false;
    };

    // 日付選択
    const handleDateSelect = (date: Date) => {
        if (isDateDisabled(date)) return;

        setSelectedDate(date);

        // 日付選択時のChangeEventを模擬
        const formattedDate = formatDate(date, dateFormat);
        const syntheticEvent = {
            target: { value: formattedDate },
            currentTarget: { value: formattedDate }
        } as ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);

        if (closeOnSelect) {
            setIsOpen(false);
        }
    };

    // 入力変更
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        const parsedDate = parseDate(value);
        if (parsedDate && !isDateDisabled(parsedDate)) {
            setSelectedDate(parsedDate);
        }

        onChange?.(e);
    };

    // カレンダーを開いた時点のキーボード移動の起点を決める
    // （選択済みがあればその日、無ければ今日）
    // インライン表示は常に開いている扱いにする
    const isCalendarOpen = inline || isOpen;

    useEffect(() => {
        if (isCalendarOpen) {
            setActiveDate((prev) => prev ?? selectedDate ?? new Date());
        } else {
            setActiveDate(null);
        }
    }, [isCalendarOpen, selectedDate]);

    // 表示月の変更を呼び出し側へ伝える
    useEffect(() => {
        onMonthChange?.(currentMonth);
        // onMonthChange は呼び出し側で再生成されうるため依存に含めない
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth]);

    /**
     * 実際に選択できる日付の一覧（昇順）
     *
     * availableDates が指定されていない場合は空。その場合は月移動を制限しない。
     */
    const selectableDates = useMemo<Date[]>(() => {
        if (!availableDates) return [];
        return availableDates
            .map((value) => (typeof value === 'string' ? new Date(value) : value))
            .filter((date) => !isDateDisabled(date))
            .sort((a, b) => a.getTime() - b.getTime());
        // isDateDisabled は毎レンダリング再生成されるため依存に含めない
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableDates, minDate, maxDate, disabledDates, disabledDaysOfWeek]);

    /** 月を「年*12+月」の通し番号にして比較しやすくする */
    const toMonthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

    /**
     * 指定方向で最も近い「選択できる日がある月」を返す。無ければ null。
     *
     * 空き枠の無い月を飛ばして移動するため、
     * 「移動したのに1日も選べない」という状態が起きない。
     */
    const findNearestMonth = (direction: -1 | 1): Date | null => {
        if (selectableDates.length === 0) return null;

        const current = toMonthIndex(currentMonth);
        const candidates = selectableDates.filter((date) =>
            direction === 1 ? toMonthIndex(date) > current : toMonthIndex(date) < current
        );
        if (candidates.length === 0) return null;

        // 次へ＝最も早い月、前へ＝最も遅い月
        const target = direction === 1 ? candidates[0] : candidates[candidates.length - 1];
        return new Date(target.getFullYear(), target.getMonth(), 1);
    };

    // availableDates を指定した場合のみ移動を制限する
    const isMonthRestricted = selectableDates.length > 0;
    const prevMonth = isMonthRestricted
        ? findNearestMonth(-1)
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const nextMonth = isMonthRestricted
        ? findNearestMonth(1)
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);

    /**
     * 表示中の月に選べる日が1日も無ければ、最も近い月へ寄せる
     *
     * 「今月は満席だが来月は空きがある」場合に、空の今月を見せないための処理。
     */
    useEffect(() => {
        if (selectableDates.length === 0) return;

        const current = toMonthIndex(currentMonth);
        if (selectableDates.some((date) => toMonthIndex(date) === current)) return;

        const nearest = selectableDates.reduce((closest, date) =>
            Math.abs(toMonthIndex(date) - current) < Math.abs(toMonthIndex(closest) - current)
                ? date
                : closest
        );
        setCurrentMonth(new Date(nearest.getFullYear(), nearest.getMonth(), 1));
    }, [selectableDates, currentMonth]);

    /** ハイライト位置を日数単位で動かす（月をまたいだら表示月も追従させる） */
    const moveActiveDate = (offset: number) => {
        const base = activeDate ?? selectedDate ?? new Date();
        const next = new Date(base);
        next.setDate(next.getDate() + offset);
        setActiveDate(next);
        if (next.getMonth() !== currentMonth.getMonth() || next.getFullYear() !== currentMonth.getFullYear()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    };

    /**
     * インライン表示時のキーボード操作
     *
     * 入力欄が無くフォーカスの置き場所がないため、
     * ハイライト中のセルだけをタブ移動の対象にする（ローミングtabindex）。
     */
    const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const dayOffsets: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };

        if (event.key in dayOffsets) {
            event.preventDefault();
            moveActiveDate(dayOffsets[event.key]);
            return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && activeDate && !isDateDisabled(activeDate)) {
            event.preventDefault();
            handleDateSelect(activeDate);
        }
    };

    // ハイライト位置が動いたらそのセルへフォーカスを移す
    useEffect(() => {
        if (!inline || !activeDate) return;
        const grid = gridRef.current;
        if (!grid || !grid.contains(document.activeElement)) return;
        grid.querySelector<HTMLButtonElement>('[data-active="true"]')?.focus();
    }, [inline, activeDate]);

    // フォーカス処理
    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
        setIsOpen(true);
        onFocus?.(event);
    };

    /**
     * 入力欄でのキーボード操作
     *
     * カレンダーを開いている間は矢印キーで日付を移動できるようにする。
     * フォーカスは入力欄に残したまま aria-activedescendant で現在位置を伝えるため、
     * 文字入力とカレンダー操作が競合しない。
     */
    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled || readonly) return;

        // 移動量（日数）が決まるキーはまとめて処理する
        const dayOffsets: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };

        if (event.key === 'Escape') {
            if (isOpen) {
                event.preventDefault();
                setIsOpen(false);
            }
            return;
        }

        if (event.key === 'Enter') {
            if (isOpen && activeDate && !isDateDisabled(activeDate)) {
                event.preventDefault();
                handleDateSelect(activeDate);
            }
            return;
        }

        if (event.key in dayOffsets) {
            event.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            moveActiveDate(dayOffsets[event.key]);
        }
    };

    // クリア
    const handleClear = () => {
        setSelectedDate(null);
        setInputValue('');

        // クリア時のChangeEventを模擬
        const syntheticEvent = {
            target: { value: '' },
            currentTarget: { value: '' }
        } as ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
    };

    const calendarDays = generateCalendarDays();
    const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

    return (
        <div ref={containerRef} className={`relative ${inline ? '' : 'max-w-sm'} ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={baseId}
                    className={`block text-sm font-medium mb-1 ${error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}
                >
                    {label}
                </label>
            )}

            {helperText && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{helperText}</p>
            )}

            {/* アイコン */}
            {!inline && showIcon && (
                <div className={`absolute inset-y-0 start-0 flex items-center ${sizeClasses[size].icon} pointer-events-none`}>
                    {icon || defaultIcon}
                </div>
            )}

            {/* 入力フィールド（インライン表示では出さない） */}
            {!inline && (
            <input
                ref={ref || inputRef}
                id={baseId}
                type="text"
                value={inputValue}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readonly}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={onBlur}
                onKeyDown={handleInputKeyDown}
                // カレンダーを展開する入力欄であることと、現在の状態を伝える
                // （aria-expandedを使うにはcomboboxロールが必要。textboxはサポートしない）
                role="combobox"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? dialogId : undefined}
                aria-activedescendant={isOpen && activeDate ? getDayId(activeDate) : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`
          bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-50 rounded-lg 
          focus:ring-blue-500 dark:focus:ring-blue-800 focus:border-blue-500 dark:focus:border-blue-500 block w-full
          dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
          dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size].input}
          ${error ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-800' : ''}
          ${className}
        `}
                {...props}
            />
            )}

            {/* クリアボタン */}
            {!inline && clearable && selectedDate && !disabled && !readonly && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {/* カレンダー */}
            {isCalendarOpen && (
                <div
                    id={dialogId}
                    // インライン表示は常設のため、ダイアログとしては扱わない
                    role={inline ? undefined : 'dialog'}
                    aria-label={inline ? undefined : '日付を選択'}
                    className={`bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 p-3 ${inline ? 'w-full' : 'absolute z-50 mt-1 shadow-lg'
                        }`}
                >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            aria-label="前の月"
                            disabled={prevMonth === null}
                            onClick={() => prevMonth && setCurrentMonth(prevMonth)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                            {monthLabel}
                        </span>

                        <button
                            type="button"
                            aria-label="次の月"
                            disabled={nextMonth === null}
                            onClick={() => nextMonth && setCurrentMonth(nextMonth)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* カレンダーはgrid/row/gridcellの構造で表現する */}
                    <div
                        ref={gridRef}
                        role="grid"
                        aria-label={monthLabel}
                        onKeyDown={inline ? handleGridKeyDown : undefined}
                    >
                        {/* 曜日ヘッダー */}
                        <div role="row" className="grid grid-cols-7 gap-1 mb-1">
                            {['日', '月', '火', '水', '木', '金', '土'].map((day, dayIndex) => (
                                <div
                                    key={day}
                                    role="columnheader"
                                    aria-label={`${day}曜日`}
                                    className={`py-2 text-sm font-medium text-center ${dayIndex === 0 ? 'text-red-500 dark:text-red-400' : dayIndex === 6 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* カレンダーグリッド（7日ずつの行に分割する） */}
                        {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
                            <div role="row" key={weekIndex} className="grid grid-cols-7 gap-1">
                                {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, index) => {
                                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const isDisabled = isDateDisabled(date);
                                    const isActive = activeDate && date.toDateString() === activeDate.toDateString();

                                    return (
                                        <button
                                            key={index}
                                            id={getDayId(date)}
                                            type="button"
                                            role="gridcell"
                                            // 読み上げ時に「5」ではなく日付全体が分かるようにする
                                            aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`}
                                            aria-selected={isSelected ? true : undefined}
                                            aria-disabled={isDisabled || undefined}
                                            aria-current={isToday ? 'date' : undefined}
                                            // 入力欄がある場合はフォーカスをそこに残すためタブ移動の対象にしない。
                                            // インライン表示ではハイライト中のセルだけをタブ移動の対象にする。
                                            tabIndex={inline ? (isActive ? 0 : -1) : -1}
                                            data-active={isActive ? 'true' : undefined}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isDisabled}
                                            className={`
                    flex h-11 w-full min-w-11 items-center justify-center
                    rounded-lg text-base hover:bg-blue-100 dark:hover:bg-blue-900
                    ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                    ${isSelected ? 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-600' : ''}
                    ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}
                    ${isActive && !isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-800' : ''}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
                  `}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* エラーメッセージ */}
            {error && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
});

Datepicker.displayName = 'Datepicker';