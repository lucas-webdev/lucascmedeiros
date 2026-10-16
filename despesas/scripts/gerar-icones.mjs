// Gera os ícones do PWA em public/despesas/. Uso: node despesas/scripts/gerar-icones.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const saida = (nome) =>
  fileURLToPath(new URL(`../../public/despesas/${nome}`, import.meta.url));

// Anel de "disponível" (arco de ~72%) sobre fundo escuro. Sem texto, para não depender de fontes.
function svg({ tamanho, escala, cantos }) {
  const r = 150;
  const circ = 2 * Math.PI * r;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${cantos}" fill="#0f172a"/>
  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">
    <circle cx="256" cy="256" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="44"/>
    <circle cx="256" cy="256" r="${r}" fill="none" stroke="#2dd4bf" stroke-width="44" stroke-linecap="round"
      stroke-dasharray="${(circ * 0.72).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 256 256)"/>
    <circle cx="256" cy="256" r="34" fill="#2dd4bf"/>
  </g>
</svg>`;
}

const variantes = [
  ["icon-192.png", { tamanho: 192, escala: 1, cantos: 96 }],
  ["icon-512.png", { tamanho: 512, escala: 1, cantos: 96 }],
  // maskable: sem cantos e conteúdo dentro da zona segura (80% central)
  ["icon-512-maskable.png", { tamanho: 512, escala: 0.78, cantos: 0 }],
  // iOS aplica o próprio arredondamento
  ["apple-touch-icon.png", { tamanho: 180, escala: 0.9, cantos: 0 }],
];

for (const [nome, opcoes] of variantes) {
  await sharp(Buffer.from(svg(opcoes))).png().toFile(saida(nome));
  console.log("gerado", nome);
}
