import { SVGProps } from 'react';

interface ArrowLeftIconProps extends SVGProps<SVGSVGElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ArrowLeftIcon = ({
    size = 'md',
    className = '',
    ...props
}: ArrowLeftIconProps) => {
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
                d="M5 12h14M5 12l4-4m-4 4 4 4" />
        </svg>
    );
}



