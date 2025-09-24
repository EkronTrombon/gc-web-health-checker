import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/assets/images/GC_Logo.svg";

export default function MainHeader() {
    return (
        <header className="bg-background text-primary dark:bg-primary dark:text-background border-b dark:border-border">
            <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                <Image src={Logo} width={200} height={200} alt="GC Logo" />
                <h1 className="text-4xl font-bold">Goldencomm Web Health Checker</h1>
                <ThemeToggle />
            </div>
        </header>
    );
}