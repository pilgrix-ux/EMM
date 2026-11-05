import "./globals.css";

export const metadata = {
  title: "EMM Ads Studio",
  description:
    "A focused creative workspace for turning your product footage into standout advertisements.",
  applicationName: "EMM Ads Studio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMM Ads Studio",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EEF0F4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
