import './style.css';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

app.innerHTML = 'Hello from TypeScript';
