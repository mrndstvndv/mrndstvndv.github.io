import './style.css';

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
