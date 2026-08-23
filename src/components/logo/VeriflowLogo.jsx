import Image from "next/image";

export default function VeriflowLogo({ variant = "", className = "" }) {
    if (variant === "dark") {
        return (
            <Image src="/veriflow_logo_dark.svg" alt="Veriflow Logo" width={144} height={36} className={className} />
        );
    } else if (variant === "light") {
        return (
            <Image src="/veriflow_logo_light.svg" alt="Veriflow Logo" width={144} height={36} className={className} />
        );
    } else if (variant === "icon") {
        return (
            <Image src="/veriflow_logo_icon.svg" alt="Veriflow Logo" width={36} height={36} className={className} />
        );
    } else if (variant === "icon-dark") {
        return (
            <Image src="/veriflow_logo_icon_dark.svg" alt="Veriflow Logo" width={36} height={36} className={className} />
        );
    } else if (variant === "icon-light") {
        return (
            <Image src="/veriflow_logo_icon_light.svg" alt="Veriflow Logo" width={36} height={36} className={className} />
        );
    } 
    return (
        <Image src="/veriflow_logo.svg" alt="Veriflow Logo" width={144} height={36} className={className} />
    );
}