# OFIR Pedidos — Como colocar no ar

## 1. Criar o projeto no Supabase
1. Crie um novo projeto Supabase (região São Paulo).
2. Abra o **SQL Editor** e cole o conteúdo do arquivo `schema.sql` (deste zip). Rode.
3. Em Project Settings > API, copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role key` (a secreta, não a anon) → vai virar `SUPABASE_SERVICE_ROLE_KEY`

## 2. Subir pro GitHub
1. Crie um repositório novo (ex: `ofir-pedidos`).
2. Arraste TODOS os arquivos e pastas deste zip pra dentro do repositório (mantendo a estrutura de pastas).

## 3. Conectar na Vercel
1. Importe o repositório na Vercel.
2. Em Environment Variables, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy.

## 4. Cadastrar sua primeira loja de teste
No SQL Editor do Supabase, rode (troque os valores):

```sql
insert into lojas (nome, cnpj, pin, cor_tema)
values ('Loja Teste', '12345678000199', '1234', '#F0B94F');
```

Depois entre no site com CNPJ `12345678000199` e PIN `1234`.

## 5. Testar o fluxo
- Toque no **+** para criar um pedido de balcão ou entrega própria.
- Toque em **"+ Simular iFood"** no topo pra ver como fica um pedido vindo do iFood.
- Arraste/toque no botão de cada card pra avançar o status.

## 6. Rastreamento de entregador em tempo real (novo)

1. No SQL Editor do Supabase, rode também o arquivo `migracao-rastreio.sql`
   (além do `schema.sql`, na ordem: primeiro schema.sql, depois este).
2. No painel, ao tocar em **"Saiu p/ entrega"** num pedido, abre um modal pra
   escolher o entregador (ou cadastrar um novo na hora, com nome e telefone).
   Se você tocar em "Despachar sem rastreio", o pedido segue normal, sem mapa.
3. O entregador escolhido recebe um link único (`/entrega/<token>`) — hoje o
   link não é enviado automaticamente por WhatsApp, mas você pode copiar a URL
   que aparece e mandar manualmente. Se quiser, posso automatizar o envio depois.
4. O entregador abre o link, toca em "Iniciar entrega", autoriza o GPS, e o
   painel passa a mostrar um botão "📍 Ver entregador no mapa" no card do
   pedido, atualizando a posição a cada poucos segundos.

**Importante sobre iPhone:** o navegador só manda a localização enquanto a
página do entregador está aberta e a tela ligada. Se ele apagar a tela ou
trocar de app, o GPS pausa. Oriente o entregador a manter a tela acesa
durante o trajeto — é uma limitação do Safari, não do sistema.

## 7. Aceite automático de pedidos do iFood (novo)

1. Rode também `migracao-aceite-automatico.sql` no Supabase.
2. Por padrão, **já vem ligado**: pedido do iFood chega e entra direto em
   "Recebido", sem precisar tocar em nada. Isso importa porque o iFood
   cancela sozinho pedidos não confirmados em até 8 minutos.
3. Se quiser revisar cada pedido antes (por exemplo, pra checar estoque),
   toque na engrenagem ⚙️ no topo do painel e desligue. Com isso desligado,
   pedidos do iFood aparecem numa faixa vermelha no topo — "Aguardando
   aceite" — com um botão de confirmar em cada um.
4. Teste com o botão "+ Simular iFood": ele respeita o que estiver
   configurado, então dá pra ver os dois comportamentos.

## 8. Cardápio com foto, relatórios e importação automática (novo)

### Cardápio
1. Aba **Cardápio** na barra inferior. Toque no + pra cadastrar item com
   foto (tirada na hora ou da galeria), nome, categoria e preço.
2. Na hora de criar um pedido de balcão/entrega própria, os itens do
   cardápio aparecem como botões rápidos — toque pra adicionar, sem digitar.

### Importar cardápio por foto (sem digitar nada)
1. Crie uma chave em **console.anthropic.com** (API Keys) — é paga por uso,
   mas o custo por foto lida é bem baixo (poucos centavos).
2. Na Vercel, adicione a variável `ANTHROPIC_API_KEY` com essa chave.
3. Na aba Cardápio, toque em **"📷 Importar foto"**, tire uma foto nítida
   do cardápio físico. A IA identifica nome, categoria e preço de cada item.
4. Você revisa a lista (pode editar nome/preço ou desmarcar o que não
   quiser) antes de confirmar. As fotos individuais de cada prato podem
   ser adicionadas depois, editando cada item.

### Relatórios
1. Aba **Relatórios**: filtro por Hoje / 7 dias / 30 dias.
2. Mostra faturamento, ticket médio, pedidos cancelados, breakdown por
   origem (iFood/Balcão/Entrega própria) e lista dos pedidos recentes.

### Storage de fotos (configuração única no Supabase)
1. No Supabase, vá em **Storage** → crie um bucket chamado `produtos`,
   marcado como **público**.
2. Não precisa configurar policy adicional — o upload acontece pelo
   backend com a service role, que já ignora RLS.

## 9. Cadastro self-service, teste grátis e painel admin (novo)

1. Rode também `migracao-multi-empresa.sql` no Supabase.
2. Na Vercel, adicione a variável `ADMIN_PASSWORD` — escolha uma senha forte
   só sua. É o acesso ao painel administrativo geral.
3. Agora existe `/cadastro`, uma página pública onde qualquer empresa se
   cadastra sozinha (nome, CNPJ, WhatsApp, PIN) e já entra com **14 dias de
   teste grátis**, sem você precisar fazer nada.
4. Seu painel fica em `/admin` (com login próprio, separado do login das
   lojas). Lá você vê todas as empresas cadastradas, com:
   - **Bloquear / Desbloquear** — por falta de pagamento, a qualquer momento
   - **Marcar como pago** — tira a empresa do controle de trial
   - **+7 dias trial** — se quiser dar mais prazo pra alguém
5. Quando uma empresa é bloqueada ou o trial vence, o painel dela mostra uma
   tela de "Acesso bloqueado" na hora (verifica a cada 30 segundos, mesmo
   se o dono já estiver com o app aberto) — com botão de falar com o
   suporte. Enquanto o trial está ativo, aparece um aviso discreto no topo
   com os dias restantes.

**Importante:** hoje não há cobrança automática (cartão, Pix recorrente
etc.) — o controle de pago/bloqueado é manual, feito por você no `/admin`.
Se quiser automatizar isso com um gateway de pagamento depois, dá pra
integrar mantendo essa mesma estrutura.

## 10. Notificação de status por WhatsApp (novo — API oficial da Meta)

### Passo a passo no Meta Business Manager (uma vez por empresa cliente)
1. Crie/acesse uma conta no **business.facebook.com** e configure um
   **WhatsApp Business Account (WABA)** com um número de telefone dedicado
   (não pode ser um número já usado no WhatsApp normal).
2. Em **WhatsApp Manager → Configuração da API**, gere:
   - o **Phone Number ID**
   - um **Access Token permanente** (crie um System User em
     Configurações do Negócio → Usuários do sistema, com permissão
     `whatsapp_business_messaging`, e gere um token sem validade)
3. Em **WhatsApp Manager → Modelos de mensagem**, crie estes 6 templates
   (categoria **Utilidade**), todos em português (pt_BR), com exatamente
   duas variáveis no corpo — `{{1}}` = número do pedido, `{{2}}` = nome da
   loja:

   | Nome exato do template | Texto sugerido |
   |---|---|
   | `ofir_pedido_recebido` | Seu pedido #{{1}} foi recebido pela {{2}} e já está na fila de preparo! |
   | `ofir_pedido_preparo` | Seu pedido #{{1}} da {{2}} entrou em preparo. |
   | `ofir_pedido_pronto` | Seu pedido #{{1}} da {{2}} está pronto! |
   | `ofir_pedido_saiu_entrega` | Seu pedido #{{1}} da {{2}} saiu para entrega. |
   | `ofir_pedido_concluido` | Seu pedido #{{1}} da {{2}} foi concluído. Obrigado pela preferência! |
   | `ofir_pedido_cancelado` | Seu pedido #{{1}} da {{2}} foi cancelado. Qualquer dúvida, fale com a gente. |

   A aprovação da Meta costuma levar de minutos a poucas horas.

### Ativando no sistema
1. Rode `migracao-whatsapp.sql` no Supabase.
2. Cada empresa, no próprio painel, abre ⚙️ Configurações → cola o
   **Phone Number ID** e o **Access Token** dela, salva, e liga o
   interruptor "Avisar cliente por WhatsApp".
3. Ao criar um pedido de balcão/entrega própria, agora tem um campo pra
   telefone do cliente (opcional). Se preenchido, ele recebe mensagem
   automática a cada mudança de status.
4. Pedidos do iFood **não** disparam essas mensagens — o cliente do iFood
   já é avisado pelo próprio app deles.

## 11. Impressão térmica (novo — sem mensalidade)

1. Rode também `migracao-fila-impressao.sql` no Supabase.
2. **Impressão manual (funciona hoje, com qualquer impressora):** no card
   de qualquer pedido, toque em **"🖨 Imprimir ticket"** — abre uma tela
   formatada pro tamanho do papel (58mm ou 80mm, configurável em
   ⚙️ Configurações) e já chama o diálogo de impressão do navegador.
3. **Impressão automática (sem tocar em nada, sem mensalidade):** pasta
   `agente-impressora/` na raiz deste zip. Tem um `README.md` próprio com
   o passo a passo completo — resumindo: instala Node.js num computador
   da loja ligado na impressora, cola o código gerado no painel, e ele
   fica imprimindo sozinho, inclusive voltando a funcionar depois de
   queda de energia/internet (usa `pm2` pra reiniciar automático).
4. Funciona com Elgin, Epson, Bematech, Tanca, Daruma e a maioria das
   térmicas — todas usam o mesmo protocolo ESC/POS.

## 12. Cardápio online — cliente final faz o pedido sozinho (novo)

1. Rode também `migracao-pedido-online.sql` no Supabase (isso já gera um
   link pra qualquer loja que você tiver cadastrado antes).
2. Toda empresa nova cadastrada em `/cadastro` já ganha esse link
   automaticamente, sem precisar configurar nada.
3. No painel, vá em ⚙️ **Configurações** — logo no topo tem o link
   completo, com botão de **copiar** e de **compartilhar no WhatsApp**.
   É esse link que você manda pro cliente final.
4. O cliente abre o link, vê o cardápio com fotos, monta o carrinho,
   preenche nome/telefone/endereço (se for entrega) e confirma — sem
   precisar de login nem instalar nada.
5. O pedido cai automaticamente no seu painel como **"Pedido online"**
   (cor verde), já em "Recebido", com impressão automática (se
   estiver ligada) e confirmação por WhatsApp pro cliente (se
   configurado).
6. Se a loja estiver bloqueada ou o trial vencido, o link mostra uma
   mensagem educada em vez do cardápio — o cliente final não consegue
   nem ver a loja nesse caso.

## O que falta pra ligar o iFood de verdade
1. Cadastro no Portal do Desenvolvedor iFood (CNPJ com CNAE de tecnologia).
2. Desenvolver e testar com o app de teste que o iFood libera automaticamente.
3. Solicitar homologação — o app já está funcional o suficiente pra passar por isso,
   só falta trocar o simulador (`/api/ifood/simular`) pelas chamadas reais em
   `/api/ifood/polling`, que já está com o passo a passo comentado no código.
4. Depois de homologado, preencher `ifood_client_id`, `ifood_client_secret` e
   `ifood_merchant_id` de cada loja na tabela `lojas` e marcar `ifood_conectado = true`.

