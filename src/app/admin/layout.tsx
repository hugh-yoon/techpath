import { AdminSidebar } from './admin-sidebar'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen bg-gt-white dark:bg-[var(--background)]">
			<AdminSidebar />
			<main className="flex-1 bg-gt-white p-6 dark:bg-[var(--background)]">{children}</main>
		</div>
	)
}
