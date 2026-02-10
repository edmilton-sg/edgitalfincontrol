
# Cadastro Completo de Empresa via CNPJ

## Resumo

Ao digitar um CNPJ completo (14 digitos), o sistema consulta a API publica CNPJa e armazena **todos** os dados retornados no banco de dados. Na tela de cadastro, apenas 3 campos extras serao exibidos (somente leitura):

- Razao Social
- Data de Abertura
- Cidade / Estado

O campo "Nome da Empresa" continua editavel.

## Dados da API que serao armazenados

A API retorna os seguintes dados que serao salvos em colunas dedicadas na tabela `companies`:

| Campo | Exemplo | Coluna no banco |
|-------|---------|-----------------|
| Razao Social | MOTO TRAXX DA AMAZONIA LTDA | `legal_name` |
| Nome Fantasia | Moto Traxx | `trade_name` |
| Data de Abertura | 2005-07-26 | `founded_date` |
| CNAE Principal | Fabricacao de motocicletas | `main_activity` |
| CNAE Principal Codigo | 3091101 | `main_activity_code` |
| CNAEs Secundarios | JSON array | `side_activities` |
| Natureza Juridica | Sociedade Empresaria Limitada | `legal_nature` |
| Porte | Demais | `company_size` |
| Optante Simples | false | `simples_optant` |
| Optante SIMEI | false | `simei_optant` |
| Capital Social | 12459029 | `equity` |
| Situacao Cadastral | Ativa | `registration_status` |
| Data Situacao | 2023-12-10 | `status_date` |
| Endereco completo | rua, numero, bairro, complemento | `address_street`, `address_number`, `address_district`, `address_details` |
| CEP | 69093415 | `address_zip` |
| Cidade | Manaus | `city` |
| Estado | AM | `state` |
| Telefones | JSON array | `phones` |
| Emails | JSON array | `emails` |
| Socios/Membros | JSON array | `members` |
| Matriz | true/false | `is_head` |

## O que aparece na tela de cadastro

```text
+------------------------------------+
| Cadastrar Empresa                  |
|                                    |
| Nome da Empresa [_______________]  |  <-- editavel
| CNPJ            [XX.XXX.XXX/XXXX] |  <-- com mascara
|                                    |
| --- Dados do CNPJ (apos busca) --- |
| Razao Social: EMPRESA XYZ LTDA    |  <-- somente leitura
| Abertura: 26/07/2005              |  <-- somente leitura
| Local: Manaus / AM                 |  <-- somente leitura
|                                    |
| [       Criar Empresa        ]     |
+------------------------------------+
```

---

## Secao Tecnica

### 1. Migration SQL

Adicionar colunas na tabela `companies`:

```sql
ALTER TABLE public.companies
  ADD COLUMN legal_name text,
  ADD COLUMN trade_name text,
  ADD COLUMN founded_date text,
  ADD COLUMN main_activity text,
  ADD COLUMN main_activity_code integer,
  ADD COLUMN side_activities jsonb DEFAULT '[]',
  ADD COLUMN legal_nature text,
  ADD COLUMN company_size text,
  ADD COLUMN simples_optant boolean DEFAULT false,
  ADD COLUMN simei_optant boolean DEFAULT false,
  ADD COLUMN equity numeric DEFAULT 0,
  ADD COLUMN registration_status text,
  ADD COLUMN status_date text,
  ADD COLUMN address_street text,
  ADD COLUMN address_number text,
  ADD COLUMN address_district text,
  ADD COLUMN address_details text,
  ADD COLUMN address_zip text,
  ADD COLUMN city text,
  ADD COLUMN state text,
  ADD COLUMN phones jsonb DEFAULT '[]',
  ADD COLUMN emails jsonb DEFAULT '[]',
  ADD COLUMN members jsonb DEFAULT '[]',
  ADD COLUMN is_head boolean;
```

### 2. `src/pages/CompanySetupPage.tsx`

- Adicionar estado `cnpjData` para armazenar resposta completa da API
- Adicionar estado `fetching` para indicador de carregamento
- No `onChange` do CNPJ: quando atingir 14 digitos, chamar `fetchCnpjData`
- Funcao `fetchCnpjData`: GET em `https://open.cnpja.com/office/{digits}`, parsear resposta e preencher `cnpjData`
- Exibir 3 campos somente leitura (razao social, data abertura, cidade/estado) quando dados carregados
- No `handleCreate`: incluir todos os campos do `cnpjData` no INSERT da tabela `companies`

### 3. `src/i18n/translations.ts`

Novas chaves:
- pt-BR: `legalName` ("Razao Social"), `foundedDate` ("Data de Abertura"), `cityState` ("Cidade / Estado"), `fetchingCnpj` ("Consultando CNPJ..."), `cnpjNotFound` ("CNPJ nao encontrado")
- en: `legalName` ("Legal Name"), `foundedDate` ("Founded Date"), `cityState` ("City / State"), `fetchingCnpj` ("Looking up tax ID..."), `cnpjNotFound` ("Tax ID not found")

### 4. API utilizada

CNPJa Open (gratuita, sem autenticacao, com CORS):
```
GET https://open.cnpja.com/office/{cnpj_14_digitos}
```

Se retornar erro, exibir toast informativo e manter campos vazios. Cadastro continua sendo possivel sem os dados da API.
