// Original local artwork. IDs are also SVG filenames.
export const stickerLibrary = Object.fromEntries([
  ['star', 'Orbit star'], ['heart', 'Open heart'], ['sparkle', 'Starlight'],
  ['smile', 'Good mood'], ['lightning', 'Lightning'], ['rocket', 'Launch'],
  ['diamond', 'Diamond'], ['crown', 'Crown'], ['flower', 'Bloom'],
  ['planet', 'Ringed planet'], ['fire', 'Creative fire'], ['paw', 'Paw'],
  ['game', 'Play'], ['arrow', 'Onward'], ['spark', 'Creative spark'],
  ['code', 'Code'], ['chart', 'Growth'], ['gear', 'Build'],
  ['cloud', 'Cloud'], ['database', 'Data'],
].map(([id, label]) => [id, { id, label, src: `/assets/stickers/${id}.svg` }]));
export const stickerCategories = {
  home: ['star', 'heart', 'sparkle', 'planet', 'flower', 'smile', 'rocket', 'fire', 'lightning', 'diamond', 'crown', 'game', 'arrow', 'spark', 'paw'],
  work: ['code', 'rocket', 'fire', 'lightning', 'chart', 'arrow', 'spark', 'star', 'diamond', 'crown', 'game', 'heart', 'planet', 'flower', 'paw'],
  services: ['gear', 'cloud', 'database', 'code', 'diamond', 'lightning', 'spark', 'star', 'planet', 'rocket', 'heart', 'crown', 'flower', 'game', 'paw'],
  about: ['heart', 'smile', 'flower', 'paw', 'game', 'crown'],
  experience: ['rocket', 'chart', 'crown', 'star', 'arrow', 'spark'],
  contact: ['heart', 'planet', 'sparkle', 'smile', 'rocket', 'flower'],
};
