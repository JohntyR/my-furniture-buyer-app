import { Roboto } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import BackgroundShapes from "@/components/BackgroundShapes";
import { getCurrentUser } from "@/lib/auth";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata = {
  title: "Furniture Buyer",
  description: "Browse the catalogue and place orders against your budget.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BackgroundShapes />
        <Nav username={user?.username} />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
