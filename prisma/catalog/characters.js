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
//
// STAMINA é a reserva DEFENSIVA (ver o campo em schema.prisma e custaStamina
// em app/lib/battle/engine.ts). Habilidade que só protege sai dela, não da
// energia, então "quantas vezes eu ataco" deixou de disputar barra com
// "quantas vezes eu me protejo".
//
// SUPORTE tem a maior de todas, e é o ponto: num 1v1 não existe aliado para
// apoiar, então o suporte só é viável se conseguir aguentar a rodada. Com
// reserva alta ele se protege muitas vezes seguidas, e o adversário precisa
// ESTOURAR antes de ela voltar em vez de simplesmente esperar. CONJURADOR
// tem a menor: ele já tem a maior reserva de energia do jogo.
//
// A trava contra o suporte invencível não é o valor daqui, é a regeneração:
// STAMINA_REGEN_PCT é menor que a da energia de propósito.

const novosAnimes = [
  { name: 'Pokémon', slug: 'pokemon', affiliations: ['Treinadores'] },
  { name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', affiliations: ['Feiticeiros', 'Maldições'] },
  { name: 'Solo Leveling', slug: 'solo-leveling', affiliations: ['Caçadores'] },
  // Marvel Universe já existe (Daredevil, Jean Grey, Emma Frost) — só ganha
  // uma afiliação nova. O upsert por slug não mexe no que já está lá.
  { name: 'Marvel Universe', slug: 'marvel-universe', affiliations: ['Mercenários'] },
  // CARTOON é universo próprio, de propósito separado de anime — Patolino é
  // o primeiro, mas a ideia é caber outros desenhos (Ben 10 e afins) como
  // afiliações diferentes dentro do mesmo universo "cartoon".
  { name: 'Cartoon', slug: 'cartoon', affiliations: ['Looney Tunes'] },
];

const characters = [
  { name: 'Aaroniero Arruruerie', class: 'TANQUE', hp: 153, attack: 16, defense: 16, speed: 9, energy: 101, stamina: 150 },
  { name: 'As Nödt', class: 'VELOZ', hp: 116, attack: 20, defense: 11, speed: 18, energy: 114, stamina: 110 },
  { name: 'Baraggan Luisenbarn', class: 'TANQUE', hp: 152, attack: 16, defense: 17, speed: 9, energy: 99, stamina: 150 },
  { name: 'Batman', class: 'SUPORTE', hp: 137, attack: 15, defense: 14, speed: 14, energy: 145, stamina: 175 },
  { name: 'Bazz-B', class: 'ATACANTE', hp: 118, attack: 25, defense: 10, speed: 14, energy: 101, stamina: 85 },
  { name: 'Broly', class: 'TANQUE', hp: 155, attack: 16, defense: 15, speed: 9, energy: 101, stamina: 150 },
  { name: 'Byakuya Kuchiki', class: 'VELOZ', hp: 115, attack: 20, defense: 12, speed: 18, energy: 110, stamina: 110 },
  { name: 'Chad', class: 'TANQUE', hp: 149, attack: 17, defense: 16, speed: 9, energy: 91, stamina: 150 },
  { name: 'Coyote Starrk', class: 'VELOZ', hp: 118, attack: 20, defense: 11, speed: 18, energy: 109, stamina: 110 },
  { name: 'Daredevil', class: 'VELOZ', hp: 119, attack: 20, defense: 11, speed: 18, energy: 104, stamina: 110 },
  { name: 'Emma Frost', class: 'CONJURADOR', hp: 119, attack: 19, defense: 12, speed: 14, energy: 163, stamina: 75 },
  { name: 'Gin Ichimaru', class: 'VELOZ', hp: 115, attack: 21, defense: 11, speed: 18, energy: 107, stamina: 110 },
  { name: 'Goku', class: 'ATACANTE', hp: 126, attack: 24, defense: 10, speed: 13, energy: 100, stamina: 85 },
  { name: 'Grimmjow Jaegerjaquez', class: 'ATACANTE', hp: 120, attack: 25, defense: 10, speed: 14, energy: 97, stamina: 85 },
  { name: 'Ichigo Kurosaki', class: 'ATACANTE', hp: 126, attack: 24, defense: 11, speed: 13, energy: 99, stamina: 85 },
  { name: 'Izuru Kira', class: 'ATACANTE', hp: 122, attack: 25, defense: 11, speed: 14, energy: 100, stamina: 85 },
  { name: 'Jean Grey', class: 'CONJURADOR', hp: 117, attack: 21, defense: 11, speed: 14, energy: 166, stamina: 75 },
  { name: 'Jūshirō Ukitake', class: 'SUPORTE', hp: 131, attack: 16, defense: 14, speed: 14, energy: 150, stamina: 175 },
  { name: 'Kaname Tosen', class: 'VELOZ', hp: 116, attack: 20, defense: 12, speed: 18, energy: 110, stamina: 110 },
  { name: 'Kenpachi Zaraki', class: 'ATACANTE', hp: 129, attack: 26, defense: 9, speed: 12, energy: 92, stamina: 85 },
  { name: 'Kisuke Urahara', class: 'CONJURADOR', hp: 117, attack: 20, defense: 12, speed: 14, energy: 159, stamina: 75 },
  { name: 'Mayuri Kurotsuchi', class: 'CONJURADOR', hp: 119, attack: 20, defense: 12, speed: 14, energy: 164, stamina: 75 },
  { name: 'Momo Hinamori', class: 'CONJURADOR', hp: 117, attack: 19, defense: 11, speed: 15, energy: 169, stamina: 75 },
  { name: 'Naruto Uzumaki', class: 'ATACANTE', hp: 127, attack: 23, defense: 11, speed: 13, energy: 105, stamina: 85 },
  { name: 'Nnoitra Gilga', class: 'ATACANTE', hp: 120, attack: 26, defense: 10, speed: 13, energy: 95, stamina: 85 },
  { name: 'Orihime Inoue', class: 'SUPORTE', hp: 137, attack: 14, defense: 14, speed: 14, energy: 167, stamina: 175 },
  { name: 'Rangiku Matsumoto', class: 'SUPORTE', hp: 133, attack: 16, defense: 14, speed: 14, energy: 150, stamina: 175 },
  { name: 'Renji Abarai', class: 'ATACANTE', hp: 122, attack: 24, defense: 11, speed: 13, energy: 100, stamina: 85 },
  { name: 'Retsu Unohana', class: 'SUPORTE', hp: 133, attack: 16, defense: 14, speed: 13, energy: 148, stamina: 175 },
  { name: 'Rukia Kuchiki', class: 'CONJURADOR', hp: 121, attack: 18, defense: 12, speed: 15, energy: 164, stamina: 75 },
  { name: 'Ryuken Ishida', class: 'ATACANTE', hp: 117, attack: 25, defense: 11, speed: 14, energy: 100, stamina: 85 },
  { name: 'Sajin Komamura', class: 'TANQUE', hp: 151, attack: 16, defense: 17, speed: 9, energy: 95, stamina: 150 },
  { name: 'Sasuke Uchiha', class: 'VELOZ', hp: 120, attack: 20, defense: 11, speed: 18, energy: 113, stamina: 110 },
  { name: 'Shunsui Kyōraku', class: 'CONJURADOR', hp: 118, attack: 20, defense: 12, speed: 15, energy: 156, stamina: 75 },
  { name: 'Sosuke Aizen', class: 'CONJURADOR', hp: 118, attack: 20, defense: 12, speed: 14, energy: 159, stamina: 75 },
  { name: 'Suì-Fēng', class: 'VELOZ', hp: 113, attack: 21, defense: 11, speed: 19, energy: 106, stamina: 110 },
  { name: 'Superman', class: 'TANQUE', hp: 154, attack: 16, defense: 16, speed: 10, energy: 101, stamina: 150 },
  { name: 'Szayelaporro Granz', class: 'CONJURADOR', hp: 118, attack: 19, defense: 12, speed: 14, energy: 164, stamina: 75 },
  { name: 'Tia Harribel', class: 'TANQUE', hp: 145, attack: 17, defense: 16, speed: 10, energy: 99, stamina: 150 },
  { name: 'Toshiro Hitsugaya', class: 'VELOZ', hp: 114, attack: 20, defense: 12, speed: 19, energy: 114, stamina: 110 },
  { name: 'Ulquiorra Cifer', class: 'ATACANTE', hp: 120, attack: 25, defense: 11, speed: 13, energy: 98, stamina: 85 },
  { name: 'Uryu Ishida', class: 'VELOZ', hp: 115, attack: 21, defense: 11, speed: 18, energy: 110, stamina: 110 },
  { name: 'Vegeta', class: 'ATACANTE', hp: 126, attack: 24, defense: 10, speed: 13, energy: 101, stamina: 85 },
  { name: 'Wonder Woman', class: 'SUPORTE', hp: 139, attack: 15, defense: 14, speed: 13, energy: 146, stamina: 175 },
  { name: 'Yamamoto Genryūsai', class: 'ATACANTE', hp: 121, attack: 25, defense: 11, speed: 12, energy: 101, stamina: 85 },
  { name: 'Yammy Llargo', class: 'TANQUE', hp: 156, attack: 17, defense: 16, speed: 8, energy: 92, stamina: 150 },
  { name: 'Yhwach', class: 'CONJURADOR', hp: 119, attack: 20, defense: 12, speed: 14, energy: 156, stamina: 75 },
  { name: 'Yoruichi Shihoin', class: 'VELOZ', hp: 115, attack: 20, defense: 11, speed: 19, energy: 109, stamina: 110 },
  { name: 'Zommari Rureaux', class: 'VELOZ', hp: 115, attack: 20, defense: 12, speed: 19, energy: 105, stamina: 110 },
];

/** Invocadores: entram já dentro do orçamento, com anime e afiliação próprios. */
const novosPersonagens = [
  { name: 'Red', slug: 'red', anime: 'pokemon', affiliation: 'Treinadores', class: 'INVOCADOR', hp: 135, attack: 17, defense: 13, speed: 12, energy: 152, stamina: 95 },
  { name: 'Suguru Geto', slug: 'suguru-geto', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'INVOCADOR', hp: 130, attack: 18, defense: 13, speed: 11, energy: 158, stamina: 95 },
  { name: 'Sung Jin Woo', slug: 'sung-jin-woo', anime: 'solo-leveling', affiliation: 'Caçadores', class: 'INVOCADOR', hp: 135, attack: 18, defense: 13, speed: 13, energy: 145, stamina: 95 },

  // Jujutsu Kaisen — elenco do segundo arco de história.
  //
  // Os stats saem dos mesmos perfis de classe do resto do elenco, dentro do
  // orçamento de ~380 (hp + 5*atk + 5*def + 4*spd + 0.3*energia). Gojo é
  // canonicamente absurdo, mas aqui ele é um CONJURADOR como os outros: a
  // superioridade dele mora no kit, não em stat privilegiado, senão a escolha
  // de personagem deixa de existir.
  { name: 'Satoru Gojo', slug: 'satoru-gojo', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'CONJURADOR', hp: 112, attack: 20, defense: 11, speed: 16, energy: 166, stamina: 75 },
  { name: 'Yuji Itadori', slug: 'yuji-itadori', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'ATACANTE', hp: 120, attack: 26, defense: 10, speed: 13, energy: 95, stamina: 85 },
  { name: 'Megumi Fushiguro', slug: 'megumi-fushiguro', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'INVOCADOR', hp: 137, attack: 17, defense: 13, speed: 12, energy: 150, stamina: 95 },
  { name: 'Nobara Kugisaki', slug: 'nobara-kugisaki', anime: 'jujutsu-kaisen', affiliation: 'Feiticeiros', class: 'ATACANTE', hp: 116, attack: 25, defense: 10, speed: 14, energy: 100, stamina: 85 },
  { name: 'Ryomen Sukuna', slug: 'ryomen-sukuna', anime: 'jujutsu-kaisen', affiliation: 'Maldições', class: 'ATACANTE', hp: 112, attack: 27, defense: 10, speed: 14, energy: 95, stamina: 85 },
  { name: 'Mahito', slug: 'mahito', anime: 'jujutsu-kaisen', affiliation: 'Maldições', class: 'CONJURADOR', hp: 124, attack: 19, defense: 11, speed: 14, energy: 165, stamina: 75 },
  { name: 'Jogo', slug: 'jogo', anime: 'jujutsu-kaisen', affiliation: 'Maldições', class: 'CONJURADOR', hp: 125, attack: 21, defense: 10, speed: 13, energy: 160, stamina: 75 },
  { name: 'Hanami', slug: 'hanami', anime: 'jujutsu-kaisen', affiliation: 'Maldições', class: 'TANQUE', hp: 158, attack: 15, defense: 17, speed: 9, energy: 95, stamina: 150 },

  // CROSSOVER GOOFY, a pedido do dono do projeto: os dois têm que ser
  // insuportáveis de propósito, não força bruta.
  //
  // DEADPOOL é mercenário, não herói de time — "Mercenários" é afiliação
  // nova dentro do Marvel Universe que já existe, em vez de forçá-lo pra
  // dentro dos Avengers ou X-Men. ATACANTE com stamina ACIMA do perfil da
  // classe: o resto do orçamento de um atacante vira ataque/velocidade, mas
  // o fator de cura dele é literalmente "quantas vezes se protege por
  // rodada" no vocabulário deste jogo.
  { name: 'Deadpool', slug: 'deadpool', anime: 'marvel-universe', affiliation: 'Mercenários', class: 'ATACANTE', hp: 122, attack: 25, defense: 10, speed: 14, energy: 97, stamina: 92 },

  // PATOLINO é CONJURADOR — a identidade é bagunça e status, não força bruta
  // (ele não tem um ataque físico forte na obra nenhuma vez). Tem
  // transformação própria (ver transformations.js): "Calça Nova da Loja"
  // vira "O Mago", que libera um ultimate só depois de ativada.
  { name: 'Patolino', slug: 'patolino', anime: 'cartoon', affiliation: 'Looney Tunes', class: 'CONJURADOR', hp: 115, attack: 17, defense: 11, speed: 13, energy: 155, stamina: 80 },
];

module.exports = { characters, novosAnimes, novosPersonagens };
