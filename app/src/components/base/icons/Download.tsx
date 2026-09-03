import { SVGProps } from "react"
import type { Size } from "@/components/base/tokens"
import { cn } from "@/lib/utils"

interface DownloadIconProps extends Omit<SVGProps<SVGSVGElement>, "className"> {
    size?: Size
}

export const DownloadIcon = ({ size = "md", ...props }: DownloadIconProps) => {
    // サイズ別のクラス
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    }

    return (
        <svg
            className={cn(sizeClasses[size], "inline-block align-middle")}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            {...props}
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4"
            />
        </svg>
    )
}
