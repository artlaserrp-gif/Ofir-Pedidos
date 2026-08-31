# Agente de impressão OFIR Pedidos — instalação

Programinha que roda num computador da loja (Windows, Mac ou Linux/Raspberry
Pi), ligado na mesma rede ou USB da impressora térmica. Ele busca os
pedidos pendentes e manda imprimir sozinho. Sem mensalidade.

**Compatível com:** qualquer impressora térmica ESC/POS — cobre Epson,
Elgin, Bematech, Tanca, Daruma e a grande maioria das térmicas vendidas
no Brasil, porque todas seguem esse mesmo protocolo.

## 1. Instalar o Node.js
Baixe e instale em **nodejs.org** (versão LTS) no computador da loja.

## 2. Configurar
1. Copie a pasta inteira `agente-impressora` pro computador da loja.
2. Abra um terminal dentro dessa pasta e rode:
   ```
   npm install
   ```
3. Copie `.env.example` para um novo arquivo chamado `.env` e preencha:
   - `OFIR_API_URL`: o endereço do seu app na Vercel
   - `OFIR_TOKEN`: gerado no painel, em ⚙️ Configurações → Impressão
     automática → "Gerar código do agente" (copie na hora, só aparece uma vez)
   - `PRINTER_INTERFACE`: o endereço da impressora — veja a opção certa
     dentro do próprio `.env.example` (rede, USB Windows, ou USB Linux/Mac)

## 3. Testar
Ainda no terminal, dentro da pasta:
```
npm start
```
Deve aparecer "Agente de impressão OFIR Pedidos iniciado". Crie um pedido
de teste no painel (com a impressão automática ligada em Configurações)
e veja se sai o ticket.

## 4. Deixar rodando sozinho, inclusive depois de reiniciar o computador
Isso é o que garante que, se a energia cair e voltar, o agente volta a
funcionar sem ninguém precisar mexer em nada. Use o **pm2** (gerenciador
de processos gratuito):

```
npm install -g pm2
pm2 start imprimir.js --name ofir-impressora
pm2 save
pm2 startup
```

O último comando (`pm2 startup`) vai mostrar uma linha de comando na tela
— copie e cole ela no terminal e rode. Isso configura o computador pra
já ligar o agente sozinho toda vez que ele for iniciado.

Pra conferir se está rodando: `pm2 list`. Pra ver os logs: `pm2 logs ofir-impressora`.

## Sobre quedas de internet e energia
- **Internet cai:** os pedidos ficam guardados na fila (no banco, na
  nuvem) esperando. O agente só não consegue buscar por um tempo, mas
  continua tentando sozinho a cada poucos segundos. Quando a internet
  volta, ele já imprime o que ficou pendente — nada se perde.
- **Energia cai:** o agente para porque o computador desligou (isso é
  inevitável). Com o `pm2 startup` configurado, assim que o computador
  ligar de novo, o agente sobe sozinho e retoma a fila.
- **Ficou muito tempo offline:** pedidos com mais de 2 horas na fila
  expiram sozinhos e não imprimem — assim não sai uma "rajada" de
  tickets de pedidos que já passaram da hora. Dá pra reimprimir
  manualmente qualquer pedido no painel, se precisar.
