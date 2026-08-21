# Edgital FinControl

Sistema web de **gestão financeira e administrativa para pequenas empresas**, construído com React, TypeScript e Supabase. Centraliza contas, receitas, despesas, notas fiscais, produtos, estoque e relatórios em um único painel.

> Projeto criado com [Lovable](https://lovable.dev) e mantido de forma open source.

## ✨ Funcionalidades

- **Financeiro**: contas bancárias, cartões, receitas, despesas e pró-labore
- **Relatórios**: DRE (Demonstração do Resultado do Exercício) e visão consolidada
- **Fiscal**: notas fiscais emitidas, notas de compra, impostos e cotações
- **Operacional**: produtos, movimentações de estoque, fornecedores e funcionários
- **Documentos**: upload e organização de documentos da empresa
- **Acesso**: login, cadastro, solicitação e aprovação de acesso (controle multiusuário)
- **Configurações**: dados da empresa e preferências do sistema

## 🛠️ Tecnologias

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- [Supabase](https://supabase.com/) (banco de dados, autenticação e RLS)
- [TanStack Query](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- [Recharts](https://recharts.org/) para gráficos e [Vitest](https://vitest.dev/) para testes

## 🚀 Rodando localmente

Pré-requisito: [Node.js](https://nodejs.org/) 18+ e npm (recomendado instalar via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# 1. Clone o repositório
git clone https://github.com/edmilton-sg/edgitalfincontrol.git
cd edgitalfincontrol

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com os dados do seu projeto Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O app ficará disponível em `http://localhost:8080` (ou na porta indicada no terminal).

## 🔐 Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto no Supabase |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave `anon` (pública) do Supabase |

Estas variáveis são **públicas** por design — em um app Vite elas são embutidas no bundle do front-end. A proteção dos dados vem das **políticas de RLS** configuradas no Supabase, não do sigilo dessas chaves. Não coloque chaves secretas (ex.: `service_role`) neste arquivo.

## 📜 Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | Verifica o código com ESLint |
| `npm run test` | Executa os testes (Vitest) |

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma [issue](https://github.com/edmilton-sg/edgitalfincontrol/issues) para relatar bugs ou sugerir melhorias, ou envie um pull request.

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE).
