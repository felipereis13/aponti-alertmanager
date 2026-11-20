# Cadastro de usuários com observabilidade

Serviço HTTP para criar, consultar, editar e excluir usuários no PostgreSQL. O monitoramento combina métricas do Prometheus com alertas encaminhados à própria API.

**Tecnologias:** Node.js, TypeScript, Express, PostgreSQL, prom-client e Docker.

## Iniciar o projeto

Use Node.js 22 ou superior e Docker Compose. Copie `.env.example` para `.env` e execute:

```bash
npm ci
docker compose up -d database
npm run dev
```

A API fica em `http://localhost:3000`. A aplicação cria a tabela `users` ao conectar ao banco.

O ambiente local usa `PORT=3000`, `DB_HOST=localhost`, `DB_PORT=5433`, `DB_USER=postgres`, `DB_PASSWORD=postgres` e `DB_NAME=crud_db`. Esses valores estão em `.env.example`.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Desenvolvimento com recarga automática |
| `npm run build` | Compilação para `dist/` |
| `npm start` | Execução do código compilado |
| `docker compose down` | Encerramento dos containers |

## Usar a API

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/api/users` | Lista de usuários |
| GET | `/api/users/:id` | Dados de um usuário |
| POST | `/api/users` | Cadastro de usuário |
| PUT | `/api/users/:id` | Atualização dos campos enviados |
| DELETE | `/api/users/:id` | Exclusão de usuário |
| GET | `/health` | Disponibilidade HTTP |
| GET | `/metrics` | Métricas em formato Prometheus |
| POST | `/api/alerts/webhook` | Recebimento de notificações |

Para cadastrar um usuário, envie um JSON para `POST /api/users`:

```json
{
  "name": "Marina Costa",
  "email": "marina@example.com",
  "role": "user"
}
```

Nome e e-mail são obrigatórios. O e-mail é único e armazenado em letras minúsculas. Se `role` não for informado, o valor será `user`.

## Organização interna

O fluxo de uma requisição passa por `routes`, `controllers`, `services` e `repositories`. As validações ficam nos services; o SQL, nos repositories. As interfaces estão em `src/models`, a conexão em `src/config` e o tratamento de erros e métricas em `src/middlewares`.

## Métricas e alertas

Os arquivos em `monitoring/` definem a coleta e os alertas de disponibilidade, erros HTTP, latência e memória. O roteamento está em `alertmanager/alertmanager.yml`. As notificações recebidas pelo webhook são registradas no console.

O Compose inclui banco, API, Prometheus e Grafana. A execução completa ainda depende dos seguintes ajustes na configuração existente:

- API: definir `DB_HOST: database` e substituir `DB_USERNAME` por `DB_USER`.
- Prometheus: montar `monitoring/prometheus.yml` em `/etc/prometheus/prometheus.yml` e `monitoring/alert.rules.yml` em `/etc/prometheus/alert.rules.yml`.
- Alertmanager: incluir o serviço `alertmanager` e carregar `alertmanager/alertmanager.yml`.
- Healthcheck do Dockerfile: usar a rota `/health`.
- Grafana: definir `GF_SECURITY_ADMIN_USER` e `GF_SECURITY_ADMIN_PASSWORD`; os diretórios de dashboards e provisionamento referenciados não estão no projeto.

Após configurar os serviços, execute `docker compose up -d --build`. O Prometheus usa a porta `9090` e o Grafana, `3001`. Se a API rodar fora do Docker, o target `api:3000` e o endereço do webhook também precisam apontar para um endereço acessível pelos containers.
