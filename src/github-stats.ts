export interface RepoStats {
	stars: number;
	language: string | null;
	topics: string[];
}

export async function fetchRepoStats(repo: string): Promise<RepoStats | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`, {
			headers: {
				Accept: 'application/vnd.github.mercy-preview+json',
				'User-Agent': 'mrndstvndv.github.io',
			},
		});
		if (!res.ok) return null;
		const data = await res.json();
		return {
			stars: data.stargazers_count ?? 0,
			language: data.language ?? null,
			topics: data.topics ?? [],
		};
	} catch {
		return null;
	}
}

export function renderStats(stats: RepoStats): string {
	let html = '';
	if (stats.stars >= 0) html += `<span class="repo-badge">★ ${stats.stars}</span> `;
	if (stats.language) html += `<span class="repo-badge lang">${stats.language}</span> `;
	for (const topic of stats.topics) {
		html += `<span class="repo-badge topic">${topic}</span> `;
	}
	return html;
}
