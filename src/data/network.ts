export type CertKey = "bio" | "dop" | "igp" | "filiera" | "famiglia" | "sostenibile";

export type Impresa = {
  nome: string;
  settore: string;
  prodotto: string;
  provincia: string;
  desc: string;
  certs: CertKey[];
};

export const certLabels: Record<CertKey, string> = {
  bio: "Biologico",
  dop: "DOP",
  igp: "IGP",
  filiera: "Filiera corta",
  famiglia: "Produzione familiare",
  sostenibile: "Sostenibile",
};

export const certEmoji: Record<CertKey, string> = {
  bio: "\u{1F331}",
  dop: "\u{1F3C5}",
  igp: "\u{1F3C5}",
  filiera: "\u{1F91D}",
  famiglia: "\u{1F468}\u200D\u{1F33E}",
  sostenibile: "\u267B\uFE0F",
};

export type ProvinceInfo = { id: string; nome: string; x: number; y: number };

export const province: ProvinceInfo[] = [
  { id: "TP", nome: "Trapani", x: 120, y: 285 },
  { id: "PA", nome: "Palermo", x: 320, y: 225 },
  { id: "ME", nome: "Messina", x: 655, y: 200 },
  { id: "AG", nome: "Agrigento", x: 315, y: 375 },
  { id: "CL", nome: "Caltanissetta", x: 420, y: 330 },
  { id: "EN", nome: "Enna", x: 470, y: 270 },
  { id: "CT", nome: "Catania", x: 585, y: 320 },
  { id: "RG", nome: "Ragusa", x: 500, y: 425 },
  { id: "SR", nome: "Siracusa", x: 625, y: 400 },
];

export const siciliaPath =
  "M 60,300 L 120,250 L 180,255 L 240,210 L 320,170 L 420,150 L 520,140 L 600,148 L 700,180 L 745,232 L 720,282 L 690,300 L 702,360 L 660,420 L 600,452 L 520,462 L 460,442 L 400,452 L 340,432 L 300,402 L 240,392 L 180,372 L 120,350 Z";

export type Stagione = { mese: string; prodotti: { emoji: string; nome: string }[] };

export const calendario: Stagione[] = [
  { mese: "Gennaio", prodotti: [{ emoji: "\u{1F34A}", nome: "Arance" }, { emoji: "\u{1F96C}", nome: "Cavoli" }, { emoji: "\u{1FAD2}", nome: "Olio nuovo" }] },
  { mese: "Febbraio", prodotti: [{ emoji: "\u{1F34B}", nome: "Limoni" }, { emoji: "\u{1F966}", nome: "Broccoli" }, { emoji: "\u{1F34A}", nome: "Mandarini" }] },
  { mese: "Marzo", prodotti: [{ emoji: "\u{1F33F}", nome: "Finocchietto" }, { emoji: "\u{1FAD8}", nome: "Fave" }, { emoji: "\u{1F34B}", nome: "Limoni" }] },
  { mese: "Aprile", prodotti: [{ emoji: "\u{1FAD8}", nome: "Piselli" }, { emoji: "\u{1F353}", nome: "Fragole" }, { emoji: "\u{1F96C}", nome: "Bietole" }] },
  { mese: "Maggio", prodotti: [{ emoji: "\u{1F352}", nome: "Ciliegie" }, { emoji: "\u{1FAD8}", nome: "Fave novelle" }, { emoji: "\u{1F952}", nome: "Zucchine" }] },
  { mese: "Giugno", prodotti: [{ emoji: "\u{1F345}", nome: "Pomodori" }, { emoji: "\u{1F348}", nome: "Meloni" }, { emoji: "\u{1F351}", nome: "Albicocche" }] },
  { mese: "Luglio", prodotti: [{ emoji: "\u{1F347}", nome: "Uva" }, { emoji: "\u{1F349}", nome: "Angurie" }, { emoji: "\u{1F345}", nome: "Pomodori" }] },
  { mese: "Agosto", prodotti: [{ emoji: "\u{1F330}", nome: "Mandorle" }, { emoji: "\u{1F347}", nome: "Uva" }, { emoji: "\u{1F336}\uFE0F", nome: "Peperoni" }] },
  { mese: "Settembre", prodotti: [{ emoji: "\u{1F347}", nome: "Vendemmia" }, { emoji: "\u{1F330}", nome: "Pistacchi" }, { emoji: "\u{1F346}", nome: "Melanzane" }] },
  { mese: "Ottobre", prodotti: [{ emoji: "\u{1FAD2}", nome: "Olive" }, { emoji: "\u{1F347}", nome: "Uva da vino" }, { emoji: "\u{1F350}", nome: "Pere" }] },
  { mese: "Novembre", prodotti: [{ emoji: "\u{1FAD2}", nome: "Olio nuovo" }, { emoji: "\u{1F34A}", nome: "Primi agrumi" }, { emoji: "\u{1F96C}", nome: "Cavolfiori" }] },
  { mese: "Dicembre", prodotti: [{ emoji: "\u{1F34A}", nome: "Arance" }, { emoji: "\u{1F34B}", nome: "Limoni" }, { emoji: "\u{1F330}", nome: "Frutta secca" }] },
];

export type Testimonianza = { nome: string; citta: string; emoji: string; testo: string };

export const testimonianze: Testimonianza[] = [
  { nome: "Giulia Marino", citta: "Palermo", emoji: "\u{1F469}", testo: "Prodotti straordinari e genuini. Ho riscoperto i sapori autentici della mia terra, e sapere che sostengo i produttori locali rende tutto più bello." },
  { nome: "Antonio Russo", citta: "Agrigento", emoji: "\u{1F468}", testo: "Finalmente una rete che valorizza le piccole aziende agricole. L'olio e il vino che ho ordinato sono di una qualità incredibile." },
  { nome: "Marta Lo Verde", citta: "Catania", emoji: "\u{1F469}\u200D\u{1F9B0}", testo: "La box stagionale è un'esperienza unica: ogni trimestre scopro nuove eccellenze siciliane. Consigliatissimo a chi ama mangiare bene." },
  { nome: "Salvatore Greco", citta: "Trapani", emoji: "\u{1F9D1}", testo: "A.M.U.N.Ì. ha dato visibilità alla mia azienda e mi ha messo in contatto con altri produttori. Fare rete funziona davvero." },
];
