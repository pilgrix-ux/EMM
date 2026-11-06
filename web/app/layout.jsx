import "./globals.css";

export const metadata = {
  title: "Pilgrix Ads Studio",
  description:
    "A focused creative workspace for turning your product footage into standout advertisements.",
  applicationName: "Pilgrix Ads Studio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pilgrix Ads Studio",
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
