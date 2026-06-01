export interface RepoStats {
	stars: number;
	language: string | null;
}

const CACHE_PREFIX = 'gh-stats:';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

interface CacheEntry {
	stats: RepoStats;
	timestamp: number;
}

function cacheKey(repo: string) {
	return CACHE_PREFIX + repo;
}

export function getCachedStats(repo: string): RepoStats | null {
	try {
		const raw = localStorage.getItem(cacheKey(repo));
		if (!raw) return null;
		const entry: CacheEntry = JSON.parse(raw);
		if (Date.now() - entry.timestamp > CACHE_TTL) return null;
		return entry.stats;
	} catch {
		return null;
	}
}

export function setCachedStats(repo: string, stats: RepoStats): void {
	try {
		const entry: CacheEntry = { stats, timestamp: Date.now() };
		localStorage.setItem(cacheKey(repo), JSON.stringify(entry));
	} catch {
		// storage full or unavailable — silently skip
	}
}

export async function fetchRepoStats(
	repo: string,
): Promise<RepoStats | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`, {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'mrndstvndv.github.io',
			},
		});
		if (!res.ok) {
			console.warn(`GitHub API error for ${repo}: ${res.status}`);
			return null;
		}
		const data = await res.json();
		return {
			stars: data.stargazers_count ?? 0,
			language: data.language ?? null,
		};
	} catch (err) {
		console.warn(`Failed to fetch ${repo}:`, err);
		return null;
	}
}

export function renderStats(stats: RepoStats): string {
	const parts: string[] = [];

	if (stats.stars > 0) {
		parts.push(`<span class="repo-badge">★ ${stats.stars}</span>`);
	}

	if (stats.language) {
		parts.push(`<span class="repo-badge lang">${stats.language}</span>`);
	}

	return parts.join(' ');
}
