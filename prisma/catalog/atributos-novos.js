// Acurácia, agilidade e inteligência: os três atributos que faltavam.
//
// POR QUE VÊM DA CLASSE E NÃO DE NÚMERO INDIVIDUAL. O resto do elenco tem
// stats escritos um a um em characters.js, mas ali cada número saiu de uma
// busca no simulador contra uma mecânica que já existia. Estes três estreiam
// junto com a mecânica deles: não há medição para escrever 63 valores
// diferentes, e inventá-los seria decorar um sistema que ninguém jogou ainda.
//
// A classe é a menor unidade defensável — VELOZ desviar mais que TANQUE é uma
// afirmação que a gente já fez em todos os outros atributos. Quando algum
// personagem pedir exceção (a Yoruichi é o candidato óbvio para agilidade
// acima da classe dela), o campo `excecoes` abaixo abre esse caminho sem
// precisar mexer em mais nada.
//
// A ESCALA É PEQUENA DE PROPÓSITO. Só a diferença entre a acurácia de quem
// bate e a agilidade de quem apanha vira evasão, a 1% por ponto e com teto de
// 15% (ver EVASAO_MAXIMA). Uma diferença de 5 pontos — que é o extremo do
// elenco, um VELOZ desviando de quem tem acurácia neutra — dá 5% de evasão.
//
// A ACURÁCIA QUASE NÃO VARIA, e a agilidade carrega a diferenciação inteira.
// É deliberado: "seu golpe passou longe" é a informação menos interessante
// que uma luta pode devolver, e espalhar acurácia entre as classes só produz
// personagens frustrantes de jogar. Agilidade é o eixo bom porque quem
// investe nela escolheu isso, e porque tem teto. É de propósito que o número
// seja modesto: numa luta de 7 a 14 rodadas, evasão alta decide partida na
// sorte, e o jogador não tem como reagir a isso.
//
// INTELIGÊNCIA NÃO ENTRA EM COMBATE. Ela desconta o preço do treino, e no
// futuro o de subir o nível de habilidade. Por isso os valores dela podem ser
// distribuídos por temperamento sem risco de desbalancear luta nenhuma.

const perfilDeClasse = {
  // ATACANTE mira bem porque o kit dele é golpe direto, e desvia pouco porque
  // troca dano de frente — é a definição do arquétipo.
  ATACANTE: { accuracy: 13, agility: 10, intelligence: 9 },

  // VELOZ é o único acima da média nos dois: quem luta de velocidade acerta e
  // some. É a classe que a mecânica de evasão existe para servir.
  VELOZ: { accuracy: 13, agility: 16, intelligence: 11 },

  // TANQUE é o oposto exato: fica parado e aguenta. A fraqueza dele é NÃO
  // DESVIAR, e só isso: acurácia fica no neutro, não abaixo. Um tanque que
  // erra além de não desviar acumula duas punições pela mesma característica,
  // e "seu golpe passou longe" é a menos interessante das duas.
  TANQUE: { accuracy: 11, agility: 7, intelligence: 10 },

  // CONJURADOR fica na acurácia neutra e leva a maior inteligência do elenco.
  // Baixar a acurácia dele foi a primeira tentativa, e estava errado por duas
  // razões: metade das habilidades dele já é lançada em si mesmo, e a classe
  // acabou de sair de um imposto invisível de escala — dar outro logo em
  // seguida é refazer o mesmo erro com outro nome.
  CONJURADOR: { accuracy: 11, agility: 11, intelligence: 15 },

  // SUPORTE não precisa de acurácia alta — boa parte do kit dele é lançada em
  // si mesmo, e efeito em si mesmo nunca erra (ver resolverAcerto).
  SUPORTE: { accuracy: 11, agility: 12, intelligence: 14 },

  // INVOCADOR fica no meio de tudo. Quando o terceiro combatente existir, é
  // aqui que a acurácia da invocação vai entrar.
  INVOCADOR: { accuracy: 11, agility: 11, intelligence: 13 },
};

// Personagem que foge do perfil da classe. Vazio hoje, e existir vazio é o
// ponto: o caminho para a exceção já está aberto quando a primeira aparecer.
const excecoes = {};

function atributosDe(nome, classe) {
  const base = perfilDeClasse[classe] || perfilDeClasse.ATACANTE;
  return { ...base, ...(excecoes[nome] || {}) };
}

module.exports = { perfilDeClasse, excecoes, atributosDe };
