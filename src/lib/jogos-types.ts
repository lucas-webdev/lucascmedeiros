export interface JogadorPartida {
  /** Username no BGG; vazio quando o jogador foi cadastrado só pelo nome. */
  username: string;
  userid: number;
  name: string;
  startPosition: string;
  color: string;
  score: string;
  isNew: boolean;
  rating: number;
  win: boolean;
}

export interface Jogo {
  id: number;
  name: string;
  subtypes: string[];
}

export interface Partida {
  id: number;
  /** YYYY-MM-DD */
  date: string;
  quantity: number;
  /** minutos; 0 quando não informado */
  length: number;
  incomplete: boolean;
  noWinStats: boolean;
  location: string;
  comments: string;
  game: Jogo;
  players: JogadorPartida[];
}

export interface PaginaPartidas {
  source: string;
  username: string;
  userId: number;
  total: number;
  page: number;
  plays: Partida[];
}

export interface ResultadoBusca {
  username: string;
  /** total informado pelo BGG (pode ser maior que partidas.length se a busca for interrompida) */
  total: number;
  partidas: Partida[];
}

export interface ProgressoBusca {
  carregadas: number;
  total: number;
  /** presente enquanto aguarda para tentar de novo (BGG ocupado) */
  aguardandoSegundos?: number;
}
