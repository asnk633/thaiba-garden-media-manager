// src/app/layout.tsx
import "./globals.css";

// Root layout must be a server component. We keep metadata here.
export const metadata = {
	title: "Thaiba Garden Media Manager",
	description: "Internal app for Thaiba Garden media team",
};

/**
 * Permanent fix:
 * Wrap the server root layout's children with the client ShellLayout that lives in (shell)/layout.tsx.
 * This keeps your pages at src/app/* (root) while allowing the shell to mount
 * the BottomNav + FAB + client providers in a single place.
 *
 * Note: importing a client component from a server component is allowed in Next.js;
 * ShellLayout is marked "use client" and will run on the client side.
 */
import ShellLayout from "./(shell)/layout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				{/* ShellLayout is a client component that renders BottomNav + FAB + providers */}
				<ShellLayout>{children}</ShellLayout>
			</body>
		</html>
	);
}