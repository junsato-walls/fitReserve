import { SVGProps } from 'react';

interface ArrowRightIconProps extends SVGProps<SVGSVGElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ArrowRightIcon({
    size = 'md',
    className = '',
    ...props
}: ArrowRightIconProps) {
    // サイズ別のクラス
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-10 h-10'
    };

    return (
        <svg
            className={`${sizeClasses[size]} inline-block align-middle ${className}`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            {...props}>
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 12H5m14 0-4 4m4-4-4-4" />
        </svg>

    );
}



