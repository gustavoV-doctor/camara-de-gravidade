# Câmara de Gravidade

PWA de força e corrida. Quatro sessões sequenciais, sem dias fixos: Força A → Corrida A → Força B → Corrida B. Tema Baki Hanma com arte oficial do anime, a pedido do usuário. App pessoal de fã, não oficial. Créditos e fontes em `ASSET-CREDITS.md`.

## Executar

Requer Node 22+ e Python 3. Sem instalação de dependências de produção.

```sh
npm test
npm run build
npm run dev
```

Abra http://127.0.0.1:4173. Não abra o HTML como `file://`: módulos e service worker precisam de HTTP local ou HTTPS.

Teste de interface opcional: `npm ci` e `npm run test:browser`, com um Chromium de testes já aberto no endpoint CDP local `127.0.0.1:18800`. O script cria um contexto isolado, usa apenas dados sintéticos e não inicia nem acessa o navegador pessoal. O servidor `npm run dev` deve estar rodando. Artefatos ficam em `verification/`, fora da publicação.

## Recursos

- Registro por série (kg e repetições), descanso e sessão pausável.
- Corrida/caminhada guiada, cronômetro por etapas, progressão manual condicionada a check-ins.
- Calibração de força com duas séries nas primeiras duas exposições de cada sessão.
- Histórico, minutos por semana, registros parciais, recuperação no dia seguinte.
- Backup JSON com validação antes de importar; importação substitui dados após confirmação.
- Instalação PWA e cache offline após primeira visita online bem-sucedida.
- Sem backend, rastreadores, login, fonts externas, segredos ou dados pessoais embutidos.

## GitHub Pages

1. Criar um repositório novo, evitando alterar apps existentes.
2. Publicar somente este diretório (nunca o workspace, vault ou backups pessoais).
3. Ativar Pages → Source: GitHub Actions.
4. O workflow testa, compila e publica apenas `dist/`.
5. Verificar o site HTTPS e a primeira instalação offline no aparelho de uso.

Não há dependência de rota absoluta: funciona também em `usuario.github.io/nome-do-repositorio/`.

## Dados e limites

Histórico fica no `localStorage` da origem + navegador. Não há criptografia local nem sincronização. Quem usa o mesmo perfil pode acessar os registros. Clearing de dados, navegação privada ou troca de aparelho podem perdê-los: exportar backups é necessário. O provedor de hospedagem recebe as requisições normais do site, mas o app não envia o histórico. Para maior isolamento, usar uma origem dedicada ou perfil de navegador exclusivo; outros apps na mesma origem GitHub Pages compartilham o contexto de armazenamento.

O cronômetro não controla equipamentos, não comprova execução e não garante som em segundo plano. Mantenha o app aberto durante a corrida; a passagem de tempo é calculada por relógio, não por contagem de callbacks. Ao sair pelo botão, a sessão é pausada. Recarregar preserva a sessão; o botão “Salvar e sair” pausa antes de fechar.

O treino é uma proposta educacional de base, não preparação específica para HYROX oficial nem prescrição clínica. O profissional que acompanha a execução deve ajustar técnica, carga e tolerância. Não há prescrição nutricional ou de medicamentos.

## Manutenção

Ao alterar arquivos cacheados, atualizar a versão `CACHE` em `public/sw.js`. Não publicar arquivos de backup, `verification/`, dados locais, cookies, notas pessoais ou credenciais. Os testes automatizados usam apenas registros sintéticos.
