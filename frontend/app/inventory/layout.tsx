import "@/app/globals.css";
import Head from "next/head";
type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <Head>
        <title>Inventory</title>
      </Head>
      {children}
    </>
  );
}
