// Classe e stats base de cada personagem.
//
// POR QUE EXISTE: todo personagem é escolhível no nível 1, de graça, mas os
// stats variavam 1,88x entre o mais forte (Superman) e a mais fraca (Orihime).
// Sem custo nem desbloqueio, isso não era escolha de estilo — era uma escolha
// certa e várias erradas, com nada avisando o jogador.
//
// CLASSE FOI ATRIBUÍDA POR INTENÇÃO, não derivada dos stats. Derivar dos stats
// perpetuaria o acidente: um classificador automático rotula o Goku como
// resistente só porque ele tinha HP alto. Chad é tanque e Orihime é suporte
// porque é isso que eles são, e os números seguem a decisão — não o contrário.
//
// COMO OS NÚMEROS SAÍRAM: cada classe tem um perfil de distribuição do mesmo
// orçamento (~380 pontos, pesando hp + 5*atq + 5*def + 4*vel + 0,3*energia).
// O stat final mistura 70% do perfil da classe com 30% do formato individual
// já normalizado, para que Kenpachi e Nnoitra sejam os dois atacantes sem
// virarem o mesmo personagem. Dispersão final: 1,02x.
//
// A classe também decide QUAL ESCADA de habilidades o personagem recebe (ver
// skill-ladders.js). Antes isso vinha da afiliação, o que forçava Chad e
// Orihime a compartilharem técnicas por serem os dois de Karakura.
//
// Consumido pelo seed e pelo sync-catalog (upsert por nome, idempotente).

/** Animes e afiliações que só existem por causa dos personagens abaixo. */
const novosAnimes = [
  { name: 'Pokémon', slug: 'pokemon', affiliations: ['Treinadores'] },
  { name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', affiliations: ['Feiticeiros'] },
  { name: 'Solo Leveling', slug: 'solo-leveling', affiliations: ['Caçadores'] },
];

const characters = [
  { name: 'Aaroniero Arruruerie', class: 'TANQUE', hp: 153, attack: 16, defense: 16, speed: 9, energy: 101 },
  { name: 'As Nödt', class: 'VELOZ', hp: 116, attack: 20, defense: 11, speed: 18, energy: 114 },
  { name: 'Baraggan Luisenbarn', class: 'TANQUE', hp: 152, attack: 16, defense: 17, speed: 9, energy: 99 },
  { name: 'Batman', class: 'SUPORTE', hp: 137, attack: 15, defense: 14, speed: 14, energy: 145 },
  { name: 'Bazz-B', class: 'ATACANTE', hp: 118, attack: 25, defense: 10, speed: 14, energy: 101 },
  { name: 'Broly', class: 'TANQUE', hp: 155, attack: 16, defense: 15, speed: 9, energy: 101 },
  { name: 'Byakuya Kuchiki', class: 'VELOZ', hp: 115, attack: 20, defense: 12, speed: 18, energy: 110 },
  { name: 'Chad', class: 'TANQUE', hp: 149, attack: 17, defense: 16, speed: 9, energy: 91 },
  { name: 'Coyote Starrk', class: 'VELOZ', hp: 118, attack: 20, defense: 11, speed: 18, energy: 109 },
  { name: 'Daredevil', class: 'VELOZ', hp: 119, attack: 20, defense: 11, speed: 18, energy: 104 },
  { name: 'Emma Frost', class: 'CONJURADOR', hp: 119, attack: 19, defense: 12, speed: 14, energy: 163 },
  { name: 'Gin Ichimaru', class: 'VELOZ', hp: 115, attack: 21, defense: 11, speed: 18, energy: 107 },
  { name: 'Goku', class: 'ATACANTE', hp: 126, attack: 24, defense: 10, speed: 13, energy: 100 },
  { name: 'Grimmjow Jaegerjaquez', class: 'ATACANTE', hp: 120, attack: 25, defense: 10, speed: 14, energy: 97 },
  { name: 'Ichigo Kurosaki', class: 'ATACANTE', hp: 126, attack: 24, defense: 11, speed: 13, energy: 99 },
  { name: 'Izuru Kira', class: 'CONJURADOR', hp: 118, attack: 20, defense: 12, speed: 14, energy: 159 },
  { name: 'Jean Grey', class: 'CONJURADOR', hp: 117, attack: 21, defense: 11, speed: 14, energy: 166 },
  { name: 'Jūshirō Ukitake', class: 'SUPORTE', hp: 131, attack: 16, defense: 14, speed: 14, energy: 150 },
  { name: 'Kaname Tosen', class: 'VELOZ', hp: 116, attack: 20, defense: 12, speed: 18, energy: 110 },
  { name: 'Kenpachi Zaraki', class: 'ATACANTE', hp: 129, attack: 26, defense: 9, speed: 12, energy: 92 },
  { name: 'Kisuke Urahara', class: 'CONJURADOR', hp: 117, attack: 20, defense: 12, speed: 14, energy: 159 },
  { name: 'Mayuri Kurotsuchi', class: 'CONJURADOR', hp: 119, attack: 20, defense: 12, speed: 14, energy: 164 },
  { name: 'Momo Hinamori', class: 'CONJURADOR', hp: 117, attack: 19, defense: 11, speed: 15, energy: 169 },
  { name: 'Naruto Uzumaki', class: 'ATACANTE', hp: 127, attack: 23, defense: 11, speed: 13, energy: 105 },
  { name: 'Nnoitra Gilga', class: 'ATACANTE', hp: 120, attack: 26, defense: 10, speed: 13, energy: 95 },
  { name: 'Orihime Inoue', class: 'SUPORTE', hp: 137, attack: 14, defense: 14, speed: 14, energy: 167 },
  { name: 'Rangiku Matsumoto', class: 'SUPORTE', hp: 133, attack: 16, defense: 14, speed: 14, energy: 150 },
  { name: 'Renji Abarai', class: 'ATACANTE', hp: 122, attack: 24, defense: 11, speed: 13, energy: 100 },
  { name: 'Retsu Unohana', class: 'SUPORTE', hp: 133, attack: 16, defense: 14, speed: 13, energy: 148 },
  { name: 'Rukia Kuchiki', class: 'CONJURADOR', hp: 121, attack: 18, defense: 12, speed: 15, energy: 164 },
  { name: 'Ryuken Ishida', class: 'ATACANTE', hp: 117, attack: 25, defense: 11, speed: 14, energy: 100 },
  { name: 'Sajin Komamura', class: 'TANQUE', hp: 151, attack: 16, defense: 17, speed: 9, energy: 95 },
  { name: 'Sasuke Uchiha', class: 'VELOZ', hp: 120, attack: 20, defense: 11, speed: 18, energy: 113 },
  { name: 'Shunsui Kyōraku', class: 'CONJURADOR', hp: 118, attack: 20, defense: 12, speed: 15, energy: 156 },
  { name: 'Sosuke Aizen', class: 'CONJURADOR', hp: 118, attack: 20, defense: 12, speed: 14, energy: 159 },
  { name: 'Suì-Fēng', class: 'VELOZ', hp: 113, attack: 21, defense: 11, speed: 19, energy: 106 },
  { name: 'Superman', class: 'TANQUE', hp: 154, attack: 16, defense: 16, speed: 10, energy: 101 },
  { name: 'Szayelaporro Granz', class: 'CONJURADOR', hp: 118, attack: 19, defense: 12, speed: 14, energy: 164 },
  { name: 'Tia Harribel', class: 'TANQUE', hp: 145, attack: 17, defense: 16, speed: 10, energy: 99 },
  { name: 'Toshiro Hitsugaya', class: 'VELOZ', hp: 114, attack: 20, defense: 12, speed: 19, energy: 114 },
  { name: 'Ulquiorra Cifer', class: 'ATACANTE', hp: 120, attack: 25, defense: 11, speed: 13, energy: 98 },
  { name: 'Uryu Ishida', class: 'VELOZ', hp: 115, attack: 21, defense: 11, speed: 18, energy: 110 },
  { name: 'Vegeta', class: 'ATACANTE', hp: 126, attack: 24, defense: 10, speed: 13, energy: 101 },
  { name: 'Wonder Woman', class: 'SUPORTE', hp: 139, attack: 15, defense: 14, speed: 13, energy: 146 },
  { name: 'Yamamoto Genryūsai', class: 'ATACANTE', hp: 121, attack: 25, defense: 11, speed: 12, energy: 101 },
  { name: 'Yammy Llargo', class: 'TANQUE', hp: 156, attack: 17, defense: 16, speed: 8, energy: 92 },
  { name: 'Yhwach', class: 'CONJURADOR', hp: 119, attack: 20, defense: 12, speed: 14, energy: 156 },
  { name: 'Yoruichi Shihoin', class: 'VELOZ', hp: 115, attack: 20, defense: 11, speed: 19, energy: 109 },
  { name: 'Zommari Rureaux', class: 'VELOZ', hp: 115, attack: 20, defense: 12, speed: 19, energy: 105 },
];

/** Invocadores: entram já dentro do orçamento, com anime e afiliação próprios. */
const novosPersonagens = [
  { name: 'Red', slug: 'red', anime: 'pokemon', affiliation: 'Treinadores', class: 'INVOCADOR', hp: 135, attack: 17, defense: 13, speed: 12, energy: 152 },
  { name: 'Suguru Geto', slug: 'suguru-geto', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'INVOCADOR', hp: 130, attack: 18, defense: 13, speed: 11, energy: 158 },
  { name: 'Sung Jin Woo', slug: 'sung-jin-woo', anime: 'solo-leveling', affiliation: 'Caçadores', class: 'INVOCADOR', hp: 135, attack: 18, defense: 13, speed: 13, energy: 145 },
];

module.exports = { characters, novosAnimes, novosPersonagens };
