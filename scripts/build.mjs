import {cp,mkdir,readFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
for(const icon of manifest.icons)await readFile(`dist/${icon.src.replace('./','')}`);
console.log('Build estático pronto em dist/. Sem dados locais no pacote.');
