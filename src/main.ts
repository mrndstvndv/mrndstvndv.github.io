import './style.css';
import { fetchRepoStats, renderStats } from './github-stats';

// Close TOC on click outside (blog pages only)
document.addEventListener('click', (e) => {
	const toggle = document.getElementById('toc-toggle') as HTMLInputElement;
	if (!toggle?.checked) return;
	const toc = document.querySelector('.page-toc');
	if (toc && !toc.contains(e.target as Node)) toggle.checked = false;
});

// Live GitHub stats for featured projects
async function loadRepoStats() {
	const items = document.querySelectorAll<HTMLLIElement>('[data-repo]');
	if (!items.length) return;

	const fetches = [...items].map(async (li) => {
		const repo = li.dataset.repo;
		const meta = li.querySelector<HTMLDivElement>('.repo-meta');
		if (!repo || !meta) return;

		const stats = await fetchRepoStats(repo);
		if (stats) meta.innerHTML = renderStats(stats);
	});

	await Promise.all(fetches);
}

loadRepoStats();
