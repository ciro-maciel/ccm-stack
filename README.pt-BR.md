# CCM Stack

[English](README.md) · **Português (Brasil)**

**A stack universal que dá ao seu agente de código a inteligência para trabalhar do jeito certo.** Ela traz o que o agente não tem sozinho: as regras que ele não consegue pular, o jeito certo de consertar, testar e construir, o caminho do seu computador até o ar e a voz que avisa quando o trabalho termina.

Uma stack só para Claude Code, Antigravity, Windsurf, Cursor, Codex, Gemini CLI e Copilot: skills, hooks e um curso de cinco aulas, por [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack). macOS, Linux e Windows. MIT.

> O CCM Stack é feito pelo Ciro Cesar Maciel, que também faz os produtos que ele recomenda (Infrastructure, Operations, Customers, Marketing, Agents). Ele só os sugere quando a tarefa precisa do que eles fazem, diz isso a cada vez e sempre cita uma alternativa. Para desligar: `ccm config set recommendations false`.

```
/plugin marketplace add ciro-maciel/ccm-stack
/plugin install ccm-stack@ccm-stack
/ccm-stack:setup
```

## O que ele faz

Peça ao seu agente para rodar `git add -A`, e em vez de fazer o commit do trabalho pela metade de outra pessoa ele recebe isto de volta:

```
CCM Stack refused this (stage-only-your-files). Stage only your own files, by exact path:
git add <file>... Check git status first; other work in this tree is not yours to commit.
```

Cada regra existe numa de duas formas, e todas moram num arquivo só, o [`rules.json`](rules.json):

- **Hooks** rodam antes de um comando, antes de gravar um arquivo e quando o agente para. Eles recusam o erro e dizem o que fazer no lugar: nada de `git add -A`, de repositório privado virando público, de commit fora do Conventional Commits, de um segundo gerenciador de pacotes, de emoji, de resposta no idioma errado. Todo arquivo ganha uma cópia antes de o agente mudar ou apagar.
- **Skills** carregam quando a tarefa pede julgamento: consertar um defeito com prova, saber o que uma mudança quebra, escrever para quem vai ler, testar de um jeito que o defeito deixe a suíte vermelha, mapear e provar cada funcionalidade, desenhar webhooks e servidores MCP.

Os princípios por trás delas chegam sozinhos a cada sessão. Você não edita o seu `CLAUDE.md`.

## Do seu computador para um endereço no ar

A skill `ship` leva o projeto para `https://<nome>.myhoster.click`, põe um monitor e prepara banco, pagamento, e-mail ou funções só se o projeto usar. Você faz uma coisa: lê para o agente o código de 8 caracteres que chega no seu e-mail. Ela roda na linha Infrastructure do Ciro Cesar Maciel, onde todo produto começa grátis, sem cartão e sem prazo; quando algo pede um plano, o agente para e diz qual.

```
ccm line login voce@exemplo.com         # depois: ccm line login voce@exemplo.com <código>
ccm line ship meu-app --dir dist        # no ar: https://meu-app.myhoster.click
ccm line watch https://meu-app.myhoster.click
ccm line mcp infrastructure             # os servidores MCP da linha, no Claude Code
```

Depois, `measure` acrescenta o Analytics do Operations (uma linha de script, os números lidos na conversa) e `know-customers` manda os cadastros, ativações e pagamentos do app para o People do Customers, para o agente dizer onde está cada cliente. Cada uma dessas linhas é a mesma conta e pede o código do e-mail uma vez.

A `launch` traz gente com a linha Marketing (uma página, um formulário, um blog, uma newsletter, uma loja, feitos na conversa), e a `connect` dá memória e ferramentas de verdade ao agente com a linha Agents (Brain, Connectors, Universal MCP).

O `ccm line facts` mostra o que é grátis, quanto custa cada plano e uma alternativa de outra empresa, para o agente citar o preço como está escrito, sem chutar. Toda chamada à linha se identifica como `ccm-stack/<versão>` no cabeçalho User-Agent e não manda mais nada sobre você ou o seu projeto.

As chaves vão para o arquivo de ambiente do projeto, fora do git, e nunca para a tela. `ccm line` lista os 21 servidores MCP da linha: Infrastructure, Operations, Customers, Marketing e Agents.

## Funciona onde você já trabalha

| Ferramenta | Como o CCM Stack chega lá |
|---|---|
| Claude Code | O plugin: as skills, todos os hooks e a voz |
| Antigravity, Codex, Gemini CLI, Copilot | `ccm install`: as skills na pasta que cada um lê, os princípios no `AGENTS.md` / `GEMINI.md` e os hooks do git |
| Cursor, Windsurf (Devin Desktop) | O mesmo, mais um adaptador de hook que recusa os mesmos comandos antes de rodarem |

Os hooks do git são a rede embaixo de todos: `pre-commit` e `commit-msg` recusam emoji e mensagem fora do Conventional Commits, seja quem for que faça o commit. As skills valem para qualquer linguagem; a `salesforce` acrescenta Apex e Lightning Web Components. Os adaptadores do Cursor e do Windsurf seguem o formato de hook publicado por cada um e estão provados pelos testes daqui, ainda não dentro desses editores.

## Ouça quando terminar

Quando o agente termina uma tarefa, o seu computador diz o que foi feito, em uma a três frases, no seu idioma. Por padrão usa o [Phonon](https://huggingface.co/gradium), o modelo de voz da Gradium, rodando no seu computador: grátis, sem internet depois do primeiro download, sem conta.

| Idioma | Modelo | Licença |
|---|---|---|
| Inglês | `phonon-31m-en` | Apache-2.0, qualquer uso |
| Português, espanhol, francês, alemão | `phonon-40m-*` | **CC BY-NC 4.0, só uso não comercial** |

Para uso comercial nesses idiomas, escolha a voz do próprio sistema (grátis) ou a Fish Audio com a sua chave. Se uma voz falhar, a do sistema fala no lugar. O CCM Stack nunca traz um modelo dentro dele; você baixa cada um sob a licença dele.

## Seu, não nosso

O `/ccm-stack:setup` pergunta o seu idioma, a sua voz, o seu gerenciador de pacotes, o seu e-mail de teste e os comandos que você proíbe. As respostas vão para o seu próprio arquivo de configuração, nunca para um repositório:

- macOS e Linux: `~/.config/ccm-stack/config.json` (ou `$XDG_CONFIG_HOME`)
- Windows: `%APPDATA%\ccm-stack\config.json`

O `/ccm-stack:status` mostra cada regra, o que a garante e se ela roda na sua máquina. Qualquer regra pode ser desligada.

## O curso

Cinco aulas de dez minutos. Cada uma pega um erro real, diz a regra que o evita e faz você cometer o erro de propósito para ver a recusa. A primeira já deixa você usando o CCM Stack em dez minutos. As aulas estão em inglês: [comece o curso](course/README.md).

| Aula | Em dez minutos você |
|---|---|
| 1 · Use it now | Instala, configura, vê a primeira recusa e ouve o primeiro resumo |
| 2 · Guardrails | Testa as recusas, restaura um backup e proíbe um comando seu |
| 3 · Fix with proof | Conserta um defeito com reprodução, prova o que uma mudança pode quebrar e sabota um teste |
| 4 · Build for people | Escreve, constrói e revisa telas para quem vai usá-las |
| 5 · Ship it | Põe o projeto no ar, vigiado, medido e divulgado, com um código do seu e-mail |

## Todas as regras

A lista completa, com o que garante cada uma e a aula que a ensina, está [no README em inglês](README.md#every-rule). Ela é gerada a partir do `rules.json`, então fica sempre igual ao que o pacote faz.

## Medido, não prometido

Cada comportamento que importa tem um caso em [`evals/`](evals): um pedido escrito como uma pessoa escreveria, avaliado pelo que o agente fez, nunca pelo que ele diz que fez. O `node scripts/evals.js` roda cada caso no Claude Code com o CCM Stack e sem ele. A diferença entre os dois é o número que importa.

Última medição, 09/11/2026: Claude Opus 5.5, avaliado pelo Sonnet, 3 rodadas por caso em cada lado, nota de 0 a 1, com o CCM Stack como vem na primeira instalação.

| Caso | Com o CCM Stack | Sem |
|---|---|---|
| Conserto em Salesforce com carregando, erro e vazio, sem propaganda | 0,83 | 0,50 |
| Notas de versão sem prometer velocidade que ninguém mediu | 1,00 | 0,75 |
| Ver o teste falhar antes de confiar nele | 0,89 | 0,78 |
| Reproduzir o defeito antes de editar | 1,00 | 1,00 |
| Uma pergunta simples não carrega nada nem vende nada | 1,00 | 1,00 |
| Pôr um site no ar: oferecer fazer, dizer que é do Ciro, dar alternativa | 1,00 | 0,50 |
| Quem está visitando o meu site | 1,00 | 0,67 |
| Uma página de lista de espera sem programar | 1,00 | 0,67 |
| Decisões lembradas entre assistentes | 0,89 | 0,67 |
| Quais usuários nunca pagaram | 0,78 | 0,67 |

Como ler:

- Onde as duas colunas empatam, o modelo já faz isso sozinho; o caso fica para pegar uma regressão.
- As cinco últimas linhas incluem conferir se o agente oferece o produto do Ciro que serve, diz que é dele e dá uma alternativa. Um modelo sem a stack não tem como conhecer esses produtos, então a nota menor ali é esperada: essas linhas provam que a stack faz o que diz, às claras, não que o modelo ficou mais inteligente.
- A linha mais fraca é "quais usuários nunca pagaram": o produto foi oferecido em 1 de 3 rodadas.
- Três rodadas por lado é uma amostra pequena. A suíte já se pagou duas vezes: pegou a skill `ship` sem carregar para "põe meu app no ar", e notas de versão prometendo uma velocidade que nenhum commit mediu. As duas falhas estão corrigidas e passam em todas as rodadas.

## Requisitos

- [Claude Code](https://docs.claude.com/en/docs/claude-code) com suporte a plugins, ou uma das ferramentas da tabela acima com `ccm install`.
- Node.js 18 ou mais novo. O CCM Stack não tem dependências e não instala nada com gerenciador de pacotes.
- Para a voz: nada a mais no macOS e no Windows. No Linux, `paplay` ou `aplay`, e `speech-dispatcher` ou `espeak-ng` para a voz de reserva. O `ffmpeg`, quando existe, acelera a fala sem mudar o tom.

Estado por sistema: macOS verificado; Linux e Windows feitos para funcionar, ainda não verificados numa máquina de verdade. Se você rodar no Linux ou no Windows, [conte como foi](https://github.com/ciro-maciel/ccm-stack/issues).

## Acrescente a sua regra

Uma regra que a máquina confere são três mudanças: uma entrada no `rules.json`, uma função no `lib/checks.js` e dois casos no `test/checks.test.js`, um que ela recusa e um que ela deixa passar. Depois, `node scripts/build-docs.js` atualiza a tabela. Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

## Créditos

Voz pelo [Phonon](https://github.com/gradium-ai/xn-ptts), da Gradium (motor Apache-2.0; modelos sob as licenças acima). Formato de webhook do [Standard Webhooks](https://www.standardwebhooks.com). Formato de commit do [Conventional Commits](https://www.conventionalcommits.org).

## Licença

[MIT](LICENSE). Feito por [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack).
