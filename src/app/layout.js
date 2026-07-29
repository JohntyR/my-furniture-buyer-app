import "./globals.css";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Furniture Buyer",
  description: "Browse the catalogue and place orders against your budget.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav username={user?.username} />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
