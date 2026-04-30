export const metadata = {
  title: "Xero Alerts",
  description: "Xero bank detail alerting service"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
