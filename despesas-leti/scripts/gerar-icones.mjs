// Gera os ícones do PWA em public/despesas-leti/. Uso: node despesas-leti/scripts/gerar-icones.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const saida = (nome) =>
  fileURLToPath(new URL(`../../public/despesas-leti/${nome}`, import.meta.url));

// Anel dividido em 5 parcelas (3 cheias, 2 vazias) sobre degradê vinho → roxo.
// Sem texto, para não depender de fontes.
function svg({ tamanho, escala, cantos }) {
  const r = 150;
  const circ = 2 * Math.PI * r;
  const parcelas = 5;
  const cheias = 3;
  const folga = 24; // espaço entre segmentos, em unidades do perímetro
  const seg = circ / parcelas - folga;
  const arcos = Array.from({ length: parcelas }, (_, i) => {
    const inicio = (circ / parcelas) * i + folga / 2;
    const opacidade = i < cheias ? 1 : 0.28;
    return `<circle cx="256" cy="256" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${opacidade}" stroke-width="46" stroke-linecap="butt"
      stroke-dasharray="${seg.toFixed(1)} ${(circ - seg).toFixed(1)}" stroke-dashoffset="${(-inicio).toFixed(1)}" transform="rotate(-90 256 256)"/>`;
  }).join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#be185d"/>
      <stop offset="1" stop-color="#6b21a8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${cantos}" fill="url(#fundo)"/>
  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">
    ${arcos}
    <circle cx="256" cy="256" r="34" fill="#ffffff"/>
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
