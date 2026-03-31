

## Limpar dados de teste do banco de dados

### O que será apagado
Todas as tabelas transacionais, mantendo usuários (profiles, user_roles, auth.users) e empresas (companies, company_members):

| Tabela | Ação |
|---|---|
| `revenues` | DELETE ALL |
| `expenses` | DELETE ALL |
| `employees` | DELETE ALL |
| `payroll` | DELETE ALL |
| `pro_labore` | DELETE ALL |
| `credit_cards` | DELETE ALL |
| `card_transactions` | DELETE ALL |
| `tax_payments` | DELETE ALL |
| `tax_settings` | DELETE ALL |
| `attachments` | DELETE ALL |
| `company_documents` | DELETE ALL |
| `categories` | DELETE ALL |
| `access_requests` | DELETE ALL |

### O que será mantido
- `profiles` — perfis de usuário
- `user_roles` — roles dos usuários
- `companies` — cadastro de empresas
- `company_members` — vínculos empresa-usuário

### Arquivos no Storage
Os arquivos físicos no bucket `attachments` também serão removidos.

### Implementação
Usar a ferramenta de inserção/delete para executar DELETEs em cada tabela na ordem correta (tabelas dependentes primeiro, como `card_transactions` antes de `credit_cards`).

