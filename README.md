# Investrack 📈

Investrack é uma aplicação web para gerir património familiar. Desenvolvida para ser simples, rápida e privada, permite-lhe gerir todas as suas contas financeiras e empréstimos num único dashboard centralizado, acessível em qualquer dispositivo da sua rede doméstica.

![Aesthetic](https://img.shields.io/badge/Design-Glassmorphism-purple)
![Responsive](https://img.shields.io/badge/UI-Mobile--Friendly-blue)
![Local](https://img.shields.io/badge/Storage-Private--Host-green)

---

## ✨ Funcionalidades Principais

### 1. Dashboard de Património Total
*   **Hero Card**: Visualize o seu património líquido total (Ativos - Dívidas) instantaneamente.
*   **Cálculo em Tempo Real**: O valor total é atualizado automaticamente sempre que edita uma conta ou empréstimo.
*   **Moeda Localizada**: Suporte total para Euro (€) com formatação numérica portuguesa.

### 2. Gestão de Contas e Investimentos
*   **Categorias Customizáveis**: Crie os seus próprios tipos de conta (ex: Brokerage, Cripto, Poupança, Imobiliário).
*   **Tags de Membro**: Identifique facilmente a quem pertence cada ativo (ex: Mario, Família).
*   **Edição Completa**: Edite saldos, nomes e categorias a qualquer momento com um simples clique.

### 3. Gestão de Empréstimos (Loans)
*   **Cálculo de Equity**: O sistema deduz automaticamente o valor em dívida do valor do ativo para calcular a sua posição líquida.
*   **Visão Detalhada**: Acompanhe a dívida total, o valor atual do ativo e o valor líquido em cada cartão.

### 4. Acesso em Rede e Sincronização
*   **Armazenamento no Host**: Os dados são guardados centralmente num ficheiro `db.json` na sua máquina principal.
*   **Multi-dispositivo**: Aceda ao app via telemóvel, tablet ou outro computador na mesma rede Wi-Fi e veja sempre os mesmos dados sincronizados.
*   **WSL2 Optimized**: Configurado para funcionar perfeitamente em ambientes Mirrored Mode no Windows.

### 5. Design Premium e Responsivo
*   **Glassmorphism**: Interface moderna com transparências, blurs e cores vibrantes.
*   **Mobile First**: Interface totalmente otimizada para smartphones, sem scroll horizontal e com botões de fácil toque.

---

## 🛠️ Stack Tecnológica

*   **Frontend**: React + Vite
*   **Backend**: Node.js + Express (ESM)
*   **Estilos**: Vanilla CSS (CSS Variables + Flexbox/Grid)
*   **Base de Dados**: JSON Persistence (Local Host)

---

## 🚀 Como Executar

### Pré-requisitos
*   Node.js instalado (v18+)

### Iniciar a Aplicação
No diretório do projeto, execute:
```bash
npm install     # Apenas na primeira vez
npm run dev     # Inicia o frontend e o backend simultaneamente
```

### Acesso na Rede
A aplicação estará disponível em:
*   **Local**: `http://localhost:5173`
*   **Rede Wi-Fi**: `http://<IP-DO-HOST>:5173` ou `http://<HOSTNAME>.local:5173`

---

## 🗄️ Estrutura de Dados
Os seus dados são privados e nunca saem da sua rede. São guardados em:
`investrack/db.json`