import { Hero } from '../components/Hero.js';
import { About } from '../components/About.js';
import { Services } from '../components/Services.js';

export function Home() {
  return `
    <div class="page page--home">
      ${Hero()}
      ${About()}
      ${Services()}
    </div>
  `;
}
