import Head from "next/head";
import "@/app/globals.css";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <Head>
        <title>Verify Your Email | TrackIt</title>
      </Head>
      {children}
    </>
  );
}
