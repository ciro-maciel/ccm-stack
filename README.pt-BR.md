# CCM Stack

[English](README.md) · **Português (Brasil)**

**O seu agente de código concorda com cada regra que você escreve e depois quebra numa tarefa longa. O CCM Stack garante as regras que a máquina consegue conferir, ensina as que pedem julgamento e fala em voz alta quando o trabalho termina.**

Skills, hooks e um curso de cinco aulas para Claude Code, Antigravity, Windsurf, Cursor, Codex, Gemini CLI e Copilot, por [Ciro Cesar Maciel](https://ciromaciel.click/?ref=oss-ccm-stack). macOS, Linux e Windows. MIT.

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
| 5 · Ship it | Põe o projeto no ar, vigiado, com um código do seu e-mail |

## Todas as regras

A lista completa, com o que garante cada uma e a aula que a ensina, está [no README em inglês](README.md#every-rule). Ela é gerada a partir do `rules.json`, então fica sempre igual ao que o pacote faz.

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
