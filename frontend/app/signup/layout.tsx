import Head from "next/head";
type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <Head>
        <title>Signup | TrackIt</title>
      </Head>
      {children}
    </>
  );
}
