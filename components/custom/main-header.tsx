import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/assets/images/GC_Logo.svg";

export default function MainHeader() {
    return (
        <header className="bg-card text-foreground border-b border-border shadow-sm">
            <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                <Image src={Logo} width={200} height={200} alt="GC Logo" />
                <ThemeToggle />
            </div>
        </header>
    );
}