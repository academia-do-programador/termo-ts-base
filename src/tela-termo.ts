import { AvaliacaoLetra } from "./dominio/avaliacao-letra.js";
import { LocalStorageService } from "./services/local-storage.service.js";
import { Termo } from "./dominio/termo.js";

class TelaTermo {
  pnlConteudo: HTMLDivElement;
  pnlTeclado: HTMLDivElement;
  pnlNotificacao: HTMLDivElement;
  pnlHistorico: HTMLDivElement;

  btnEnter: HTMLButtonElement;
  btnApagar: HTMLButtonElement;
  btnExibirHistorico: HTMLButtonElement;

  linhas: HTMLDivElement[];
  letrasClicadas: HTMLButtonElement[];

  private jogo: Termo;
  private localStorageService: LocalStorageService;
  private indiceAtual: number;

  get linhaAtual(): HTMLDivElement {
    return this.linhas[this.jogo.tentativas];
  }

  constructor() {
    this.localStorageService = new LocalStorageService();
    this.jogo = new Termo(this.localStorageService.carregarDados());
    this.indiceAtual = 0;

    this.registrarElementos();
    this.registrarEventos();
    this.popularEstatisticas();
    this.desenharGridTentativas();
  }

  digitarLetra(sender: Event): void {
    if (this.indiceAtual == 5) return;

    const botao = sender.target as HTMLButtonElement;

    this.letrasClicadas.push(botao);

    const letra = this.linhaAtual.children[this.indiceAtual];
    letra.textContent = botao.textContent;

    this.indiceAtual++;
  }

  apagarLetra(): void {
    if (this.indiceAtual <= 0) return;

    this.indiceAtual--;

    this.letrasClicadas.pop();

    const letra = this.linhaAtual.children[this.indiceAtual];
    letra.textContent = '';
  }

  avaliarLinha(): void {
    if (this.indiceAtual != 5) return;

    const palavraObtida: string = this.obterPalavraLinha();
    const avaliacoes: AvaliacaoLetra[] = this.jogo.avaliarPalavra(palavraObtida);

    this.colorirLabels(avaliacoes);
    this.colorirBotoes(avaliacoes);

    this.jogo.registrarTentativa();

    this.indiceAtual = 0;
    this.letrasClicadas = new Array<HTMLButtonElement>();

    const jogadorAcertou: boolean = this.jogo.jogadorAcertou(palavraObtida);

    if (jogadorAcertou || this.jogo.jogadorPerdeu()) {
      this.exibirNotificacao(jogadorAcertou);
      this.exibirBotaoReiniciar();

      this.btnEnter.disabled = true;

      this.atualizarHistorico();
    }
  }


  reiniciarJogo(): void {
    this.limparGrid();
    this.limparTeclado();
    
    this.pnlNotificacao.replaceChildren();
    this.btnEnter.disabled = false;

    this.jogo = new Termo(this.localStorageService.carregarDados());
  }

  private obterPalavraLinha(): string {
    const labelsLetra = Array.from(this.linhaAtual.children);

    let palavraObtida = '';

    for (let letra of labelsLetra)
      palavraObtida += letra.textContent?.trim();

    return palavraObtida;
  }

  private colorirBotoes(avaliacoes: AvaliacaoLetra[]): void {
    for (let i = 0; i < avaliacoes.length; i++) {
      const botao = this.letrasClicadas[i];

      switch (avaliacoes[i]) {
        case AvaliacaoLetra.PosicaoCorreta:
          botao.classList.add('letra-posicao-correta');
          break;

        case AvaliacaoLetra.PosicaoIncorreta:
          botao.classList.add('letra-posicao-incorreta');
          break;

        case AvaliacaoLetra.NaoExistente:
          botao.classList.add('letra-nao-existente');
          break;
      }
    }
  }

  private colorirLabels(avaliacoes: AvaliacaoLetra[]): void {
    for (let i = 0; i < avaliacoes.length; i++) {
      const letraSelecionada = this.linhaAtual.children[i] as HTMLDivElement;

      switch (avaliacoes[i]) {
        case AvaliacaoLetra.PosicaoCorreta:
          letraSelecionada.classList.add('letra-posicao-correta');
          break;

        case AvaliacaoLetra.PosicaoIncorreta:
          letraSelecionada.classList.add('letra-posicao-incorreta');
          break;

        case AvaliacaoLetra.NaoExistente:
          letraSelecionada.classList.add('letra-nao-existente');
          break;
      }
    }
  }

  private exibirNotificacao(jogadorAcertou: boolean): void {
    const lblNotificacao: HTMLParagraphElement =
      document.createElement('p');

    let mensagemNotificacao = '';

    if (jogadorAcertou) {
      mensagemNotificacao = 'Você acertou a palavra secreta, parabéns!';
      lblNotificacao.classList.add('notificacao-acerto');
    }
    else {
      mensagemNotificacao = 'Você não conseguiu! Tente novamente.';
      lblNotificacao.classList.add('notificacao-erro');
    }

    lblNotificacao.textContent = mensagemNotificacao;

    this.pnlNotificacao.appendChild(lblNotificacao);
  }

  private exibirBotaoReiniciar(): void {
    const btnReiniciar: HTMLButtonElement = document.createElement('button');
    
    btnReiniciar.innerHTML =
      `<span class="material-symbols-outlined">refresh</span>Reiniciar`;

    btnReiniciar.classList.add('btn-reiniciar');

    btnReiniciar.addEventListener('click', () => this.reiniciarJogo());

    this.pnlNotificacao.appendChild(btnReiniciar);
  }

  private limparGrid(): void {
    const classesParaRemover: string[] = [
      'letra-posicao-correta',
      'letra-posicao-incorreta',
      'letra-nao-existente'
    ];

    for (let linha of this.linhas) {
      for (let letra of linha.children) {
        letra.textContent = '';
        letra.classList.remove(...classesParaRemover);
      }
    }
  }

  private limparTeclado(): void {
    const classesParaRemover: string[] = [
      'letra-posicao-correta',
      'letra-posicao-incorreta',
      'letra-nao-existente'
    ];

    for (let botao of this.pnlTeclado.children) {
      botao.classList.remove(...classesParaRemover);
    }
  }

  private popularEstatisticas(): void {
    const lblJogos = document.getElementById('lblJogos') as HTMLParagraphElement;
    const lblVitorias = document.getElementById('lblVitorias') as HTMLParagraphElement;
    const lblDerrotas = document.getElementById('lblDerrotas') as HTMLParagraphElement;
    const lblSequencia = document.getElementById('lblSequencia') as HTMLParagraphElement;

    lblJogos.textContent = this.jogo.historico.jogos.toString();
    lblVitorias.textContent = this.jogo.historico.vitorias.toString();
    lblDerrotas.textContent = this.jogo.historico.derrotas.toString();
    lblSequencia.textContent = this.jogo.historico.sequencia.toString();
  }

  private desenharGridTentativas(): void {
    const elementos =
      Array.from(document.querySelectorAll('.valor-tentativa')) as HTMLParagraphElement[];
    
    const tentativas = this.jogo.historico.tentativas;

    for (let i = 0; i < tentativas.length; i++) {
      const label = elementos[i];
      const qtdTentativas = tentativas[i];

      label.textContent = qtdTentativas.toString();

      let tamanho: number = 0;

      if (qtdTentativas > 0 && this.jogo.historico.vitorias > 0)
        tamanho = qtdTentativas / this.jogo.historico.vitorias;
      else
        tamanho = 0.05;

      const novoTamanho = tamanho * 100;      
      label.style.width = `${(novoTamanho).toString()}%`;
    }
  }

  private atualizarHistorico(): void {
    this.localStorageService.salvarDados(this.jogo.historico);
    
    this.popularEstatisticas();
    this.desenharGridTentativas();
  }
  
  private registrarElementos(): void {
    this.letrasClicadas = new Array<HTMLButtonElement>();
    
    this.pnlConteudo = document.getElementById('pnlConteudo') as HTMLDivElement;
    this.pnlTeclado = document.getElementById('pnlTeclado') as HTMLDivElement;
    this.pnlNotificacao = document.getElementById('pnlNotificacao') as HTMLDivElement;
    this.pnlHistorico = document.getElementById('pnlHistorico') as HTMLDivElement;

    this.btnEnter = document.getElementById('btnEnter') as HTMLButtonElement;
    this.btnApagar = document.getElementById('btnApagar') as HTMLButtonElement;
    this.btnExibirHistorico = document.getElementById('btnExibirHistorico') as HTMLButtonElement;

    this.linhas = Array.from(document.querySelectorAll('.linha'));
  }

  private registrarEventos(): void {
    this.btnExibirHistorico.addEventListener('click', () => {
      this.pnlHistorico.style.display = 'grid';
    });

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (!this.pnlHistorico.contains(target) && event.target != this.btnExibirHistorico)
        this.pnlHistorico.style.display = 'none';
    });

    const botoesTeclado = this.pnlTeclado.children;

    for (let botao of botoesTeclado) {
      if (botao.id != 'btnEnter' && botao.id != 'btnApagar')
        botao.addEventListener('click', (sender) => this.digitarLetra(sender));
    }

    this.btnEnter.addEventListener('click', () => this.avaliarLinha());
    this.btnApagar.addEventListener('click', () => this.apagarLetra());
  }
}

window.addEventListener('load', () => new TelaTermo());