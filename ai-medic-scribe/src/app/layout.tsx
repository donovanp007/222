import "./globals.css";
import { ErrorBoundary } from "../components/ErrorBoundary";

export const metadata = {
  title: "AI Medical Scribe - Smart Healthcare Documentation",
  description: "Advanced medical transcription platform with AI-powered note structuring for South African healthcare providers. Streamline patient documentation with intelligent templates and real-time transcription.",
  keywords: "medical transcription, healthcare AI, patient notes, medical documentation, South Africa healthcare, POPIA compliant",
  authors: [{ name: "AI Medical Scribe Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AI Medical Scribe - Smart Healthcare Documentation",
    description: "Advanced medical transcription platform with AI-powered note structuring for South African healthcare providers.",
    type: "website",
    locale: "en_ZA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-gray-50" suppressHydrationWarning={true}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}