

# FinControl — Dashboard Visual (Fase 1 Frontend)

## Visão Geral
Construir o frontend do Dashboard do FinControl com dados mockados, usando paleta **azul corporativo**, interface **bilíngue (pt-BR + English)**, e layout inspirado nas referências UX fornecidas (sidebar + dashboard central com cards/gráficos).

---

## 1. Layout Base
- **Sidebar esquerda** colapsável com ícones e navegação principal:
  - Dashboard, Fluxo de Caixa, Receitas, Despesas, Cartões, DRE, Impostos, Funcionários, Pró-labore, Relatórios, Configurações
- **Header superior** com busca, notificações e avatar do usuário
- **Área central** responsiva com grid de widgets

## 2. Dashboard Principal
- **Cards de resumo** no topo: Saldo Atual, Receita Mensal, Despesa Mensal, Lucro Operacional
- **Gráfico de barras** — Receitas vs Despesas por mês (Recharts)
- **Gráfico de linha/área** — Saldo Acumulado ao longo do tempo
- **Card de Fluxo de Caixa** com projeção simplificada
- **Card de Impostos Futuros** com próximo DAS a vencer
- **Tabela de Transações Recentes** com nome, data, valor, status

## 3. Páginas Placeholder (navegáveis pela sidebar)
- Cada módulo (Receitas, Despesas, Fluxo de Caixa, etc.) terá uma página com layout básico e mensagem "Em breve" — prontas para receber funcionalidade real nas próximas fases

## 4. Sistema de Idiomas (i18n)
- Suporte a **pt-BR** (padrão) e **English**
- Seletor de idioma no header ou configurações
- Textos da interface traduzidos dinamicamente

## 5. Design Visual
- Paleta **azul corporativo**: tons de azul escuro/médio para elementos primários, branco/cinza claro para fundo
- Verde para indicadores positivos (receitas, lucro)
- Vermelho para indicadores negativos (despesas, alertas)
- Cards com cantos arredondados, sombras suaves
- Tipografia limpa e hierarquia visual clara
- Dark mode opcional via toggle

## 6. Responsividade
- Layout adaptável para desktop e tablet
- Sidebar colapsável em telas menores
- Cards reorganizam em coluna no mobile

---

**Resultado:** Um dashboard visual completo e navegável com dados de exemplo, pronto para conexão com backend (Supabase) na próxima fase.

