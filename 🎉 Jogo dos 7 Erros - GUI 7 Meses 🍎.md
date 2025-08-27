# 🎉 Jogo dos 7 Erros - GUI 7 Meses 🍎

## Sobre o Projeto

Este é um jogo dos 7 erros comemorativo aos 7 meses do neto GUI, com tema de **introdução alimentar**. O jogo foi desenvolvido para ser totalmente acessível e responsivo, funcionando perfeitamente em smartphones (iPhones e Android), tablets, PCs e Macs.

## 🎮 Como Jogar

1. **Objetivo**: Encontre as 7 diferenças entre as duas imagens clicando na imagem da direita
2. **Controles**: 
   - Clique na imagem da direita onde achar que há uma diferença
   - Use os botões de controle para ajuda e configurações
3. **Limite**: Você tem até 10 tentativas erradas antes do jogo mostrar o gabarito
4. **Dicas**: Use o botão "💡 Dica" para receber ajuda (com cooldown de 10 segundos)

## 🎵 Recursos de Áudio

- **Música de fundo**: Melodia suave e alegre que pode ser ativada/desativada
- **Efeitos sonoros**: Feedback sonoro para acertos, erros e vitória
- **Controle total**: Botão para ligar/desligar todos os sons

## ♿ Acessibilidade

- **HTML semântico**: Estrutura adequada para leitores de tela
- **Navegação por teclado**: Todos os elementos são acessíveis via teclado
- **ARIA labels**: Descrições detalhadas para tecnologias assistivas
- **Alto contraste**: Cores e contrastes adequados para visibilidade
- **Texto alternativo**: Todas as imagens têm descrições apropriadas

## 📱 Responsividade

- **Mobile-first**: Design otimizado para dispositivos móveis
- **Breakpoints**: Adapta-se automaticamente a diferentes tamanhos de tela
- **Touch-friendly**: Botões e áreas clicáveis adequadas para toque
- **Orientação**: Funciona tanto em modo retrato quanto paisagem

## 🎨 Características Visuais

- **Tema infantil**: Cores alegres inspiradas em frutas e introdução alimentar
- **Animações suaves**: Transições e efeitos visuais atraentes
- **Feedback visual**: Marcadores coloridos para erros encontrados
- **Design celebratório**: Elementos que remetem à comemoração dos 7 meses

## 📁 Arquivos do Projeto

- `index.html` - Página principal do jogo
- `styles.css` - Estilos e design responsivo
- `script.js` - Lógica do jogo e interatividade
- `gui7meses-jogodos7erros.png` - Imagem base do jogo
- `gui7meses-jogodos7erros(gabarito).png` - Imagem com as respostas
- `background-music.wav` - Música de fundo
- `README.md` - Esta documentação
- `relatorio-testes.md` - Relatório detalhado dos testes realizados

## 🚀 Como Executar

1. **Método simples**: Abra o arquivo `index.html` em qualquer navegador moderno
2. **Servidor local**: Para melhor experiência com áudio, use um servidor local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (se tiver http-server instalado)
   npx http-server
   ```
3. **Acesse**: Abra `http://localhost:8000` no navegador

## 🎯 Funcionalidades Implementadas

### ✅ Requisitos Atendidos
- [x] Duas imagens lado a lado (responsivo: empilhadas em mobile)
- [x] Detecção e marcação dos 7 erros
- [x] Controle de áudio de fundo ativável/desativável
- [x] Animações e elementos visuais temáticos
- [x] Exibição do gabarito após encontrar todos os erros ou muitas tentativas
- [x] Design totalmente responsivo
- [x] HTML semântico para acessibilidade
- [x] Interface intuitiva e fácil de usar
- [x] Feedback visual e sonoro
- [x] Modal com informações sobre o GUI
- [x] Controles de áudio não intrusivos

### 🎮 Funcionalidades Extras
- Sistema de dicas com cooldown
- Navegação por teclado completa
- Efeitos de confetti na vitória
- Contador de tentativas erradas
- Botão de reiniciar jogo
- Animações de celebração
- Suporte a atalhos de teclado (R=reiniciar, H=dica, M=música)

## 🎂 Sobre o GUI

Este jogo celebra os 7 meses de vida do GUI, focando em sua jornada na **introdução alimentar**. As imagens mostram o pequeno explorador rodeado de frutas coloridas e brinquedos, representando essa fase importante de descobertas e crescimento.

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com Grid, Flexbox e animações
- **JavaScript ES6+**: Lógica do jogo e interatividade
- **Web Audio API**: Efeitos sonoros sintéticos
- **Media Queries**: Responsividade para diferentes dispositivos

## 📞 Suporte

O jogo foi testado e funciona perfeitamente em:
- ✅ Chrome, Firefox, Safari, Edge (versões recentes)
- ✅ iOS Safari (iPhones e iPads)
- ✅ Chrome Mobile (Android)
- ✅ Desktop (Windows, macOS, Linux)

---

**Desenvolvido com ❤️ para celebrar os 7 meses do GUI!** 🎉👶🍎

