import './style.css';
import {
	fetchRepoStats,
	getCachedStats,
	setCachedStats,
	renderStats,
} from './github-stats';

// Close TOC on click outside
document.addEventListener('click', (e) => {
	const toc = document.querySelector('.page-toc');
	const toggle = document.getElementById('toc-toggle') as HTMLInputElement;
	if (!toc || !toggle) return;
	if (!toggle.checked) return;
	if (!toc.contains(e.target as Node)) {
		toggle.checked = false;
	}
});

// Live GitHub stats for featured projects
async function loadRepoStats() {
	const items = document.querySelectorAll<HTMLLIElement>('[data-repo]');
	if (!items.length) return;

	for (const li of items) {
		const repo = li.dataset.repo;
		if (!repo) continue;

		const meta = li.querySelector<HTMLDivElement>('.repo-meta');
		if (!meta) continue;

		// Show cached immediately (stale-while-revalidate)
		const cached = getCachedStats(repo);
		if (cached) {
			meta.innerHTML = renderStats(cached);
		} else {
			meta.innerHTML = '<span class="repo-commit">loading…</span>';
		}

		// Fetch fresh data in background
		const stats = await fetchRepoStats(repo);
		if (stats) {
			setCachedStats(repo, stats);
			meta.innerHTML = renderStats(stats);
		} else if (!cached) {
			// Fetch failed and no cache — hide the loading indicator
			meta.innerHTML = '';
		}
		// If fetch failed but cache exists, cache is already shown — keep it
	}
}

loadRepoStats();
