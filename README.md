# Brasquete 🏀

Brasquete é um jogo web de simulação de basquete inspirado no Brasfoot, voltado para a **gestão de times da NBA**. No MVP, você pode gerenciar escalação, simular partidas, acompanhar táticas e energia dos jogadores.

---

## 🚀 Funcionalidades do MVP

- Simulação de partidas entre times (Golden State Warriors x Boston Celtics)
- Gerenciamento de elenco e seleção de titulares/reservas
- Visualização de energia e estatísticas básicas dos jogadores
- Placar por período e resultado final da partida
- Tudo armazenado localmente (`localStorage`), sem backend

---

## 🏗️ Tecnologias

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- React.js
- JavaScript/TypeScript
- HTML/CSS
- LocalStorage (para persistência de dados)

---

## 📂 Estrutura do Projeto

```
src/
├─ app/
│  ├─ page.tsx           # Página inicial / dashboard
│  └─ match/
│     └─page.tsx     # Simulação de partidas
├─ data/
│  └─ teams.ts           # Dados dos times e jogadores
└─ utils/
   └─ simulation.ts      # Funções de simulação de partidas
```

---

## ⚡ Como rodar

1. Clone o repositório:
    ```bash
    git clone <URL_DO_REPO>
    ```

2. Entre na pasta do projeto:
    ```bash
    cd brasquete
    ```

3. Instale as dependências (usando pnpm):
    ```bash
    pnpm install
    ```

4. Rode o projeto:
    ```bash
    pnpm dev
    ```

5. Abra no navegador:  
   [http://localhost:3000](http://localhost:3000)

---

## 📈 Roadmap do MVP

- Protótipo do motor de partidas
- Gestão de elenco e escalação
- Táticas básicas para partidas
- Tela de partida interativa com substituições
- Tela de resultado e salvar progresso

---

## 📝 Licença

MIT License. Veja o arquivo LICENSE para mais detalhes.

---

## 🤝 Contribuição

Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro para discutir o que você quer mudar.

---

## 🎯 Contato

Desenvolvido por João Gabriel, André Lucas e Matheus Santos.  
Email: joaogabrielsj2004@gmail.com, andrelucascoelho281@gmail.com e msantossilva005@gmail.com