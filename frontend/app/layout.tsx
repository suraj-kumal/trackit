import { ThemeProvider } from "@/app/components/theme-provider";
import "@/app/globals.css";
import { Inter, Architects_Daughter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "700"],
});

const architectsDaughter = Architects_Daughter({
    weight: "400",
    subsets: ["latin"],
});

type RootLayoutProps = {
    children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <>
            <html
                lang="en"
                suppressHydrationWarning
                className={`${architectsDaughter.className} antialiased`}
            >
                <head>
                    <title>TrackIt</title>
                </head>
                <body>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </>
    );
}
