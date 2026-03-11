import Link from 'next/link'

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gt-white p-8">
			<h1 className="text-3xl font-semibold tracking-tight text-gt-navy">
				TechPath
			</h1>
			<p className="text-gt-gray-matter">
				Georgia Tech course information and planning
			</p>
			<nav
				className="mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
				aria-label="Main"
			>
				<Link
					href="/dashboard"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Course Search</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Find courses and sections</span>
				</Link>
				<Link
					href="/schedule"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Schedule Builder</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Build semester schedules</span>
				</Link>
				<Link
					href="/career"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-navy">Career Planner</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Plan your degree path</span>
				</Link>
				<Link
					href="/admin"
					className="flex flex-col rounded-xl border-2 border-gt-pi-mile bg-gt-white p-6 text-left shadow-sm transition-colors hover:border-gt-tech-gold hover:bg-gt-diploma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span className="text-lg font-semibold text-gt-tech-dark-gold">Admin</span>
					<span className="mt-1 text-sm text-gt-gray-matter">Manage courses and data</span>
				</Link>
			</nav>
		</div>
	)
}
