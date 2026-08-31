// Agente de impressão local do OFIR Pedidos.
// Roda num computador/mini-PC ligado na mesma rede (ou USB) da impressora
// térmica da loja. Consulta a fila de pedidos pendentes a cada poucos
// segundos e manda imprimir automaticamente — sem mensalidade nenhuma.

require('dotenv').config();
const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer');

const API_URL = process.env.OFIR_API_URL;
const TOKEN = process.env.OFIR_TOKEN;
const PRINTER_TYPE = (process.env.PRINTER_TYPE || 'epson').toUpperCase();
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE;
const INTERVALO = Number(process.env.INTERVALO_SEGUNDOS || 5) * 1000;

if (!API_URL || !TOKEN || !PRINTER_INTERFACE) {
  console.error('❌ Configure o arquivo .env antes de iniciar (copie .env.example para .env).');
  process.exit(1);
}

function montarImpressora() {
  return new ThermalPrinter({
    type: PrinterTypes[PRINTER_TYPE] || PrinterTypes.EPSON,
    interface: PRINTER_INTERFACE,
    width: 48
  });
}

function imprimirTicket(printer, ticket) {
  const larguraEstreita = ticket.largura_papel === '58mm';
  if (larguraEstreita) printer.setTextSize(0, 0);

  printer.alignCenter();
  printer.bold(true);
  printer.println(ticket.loja_nome);
  printer.bold(false);
  printer.println(ticket.origem);
  printer.drawLine();

  printer.alignLeft();
  printer.bold(true);
  printer.println(`PEDIDO #${ticket.numero_pedido}`);
  printer.bold(false);
  if (ticket.cliente_nome) printer.println(`Cliente: ${ticket.cliente_nome}`);
  if (ticket.cliente_telefone) printer.println(`Tel: ${ticket.cliente_telefone}`);
  if (ticket.tipo_entrega === 'entrega' && ticket.endereco_entrega) {
    printer.println(`End: ${ticket.endereco_entrega}`);
  }
  printer.drawLine();

  for (const item of ticket.itens || []) {
    printer.println(`${item.quantidade}x ${item.nome_produto}`);
    if (item.observacoes) printer.println(`  obs: ${item.observacoes}`);
  }
  printer.drawLine();

  printer.leftRight('Itens', `R$ ${Number(ticket.valor_itens).toFixed(2)}`);
  if (ticket.valor_entrega > 0) {
    printer.leftRight('Entrega', `R$ ${Number(ticket.valor_entrega).toFixed(2)}`);
  }
  printer.bold(true);
  printer.leftRight('TOTAL', `R$ ${Number(ticket.valor_total).toFixed(2)}`);
  printer.bold(false);

  if (ticket.forma_pagamento) printer.println(`Pagamento: ${ticket.forma_pagamento}`);
  if (ticket.observacoes) printer.println(`Obs: ${ticket.observacoes}`);

  printer.cut();
}

async function buscarFila() {
  const res = await fetch(`${API_URL}/api/impressao/fila`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!res.ok) throw new Error(`Falha ao buscar fila (${res.status})`);
  const data = await res.json();
  return data.tickets || [];
}

async function confirmar(jobId, sucesso, erro) {
  await fetch(`${API_URL}/api/impressao/confirmar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, sucesso, erro })
  }).catch(() => {});
}

async function cicloDePrint() {
  let tickets;
  try {
    tickets = await buscarFila();
  } catch (e) {
    console.error('⚠️  Não foi possível consultar a fila (internet caiu?):', e.message);
    return; // tenta de novo no próximo ciclo — nada se perde
  }

  for (const ticket of tickets) {
    try {
      const printer = montarImpressora();
      const conectado = await printer.isPrinterConnected();
      if (!conectado) throw new Error('Impressora não respondeu (verifique cabo/rede/energia dela).');

      imprimirTicket(printer, ticket);
      await printer.execute();
      console.log(`✅ Pedido #${ticket.numero_pedido} impresso.`);
      await confirmar(ticket.job_id, true);
    } catch (e) {
      console.error(`❌ Erro ao imprimir pedido #${ticket.numero_pedido}:`, e.message);
      await confirmar(ticket.job_id, false, e.message);
    }
  }
}

console.log('🖨️  Agente de impressão OFIR Pedidos iniciado.');
console.log(`   Verificando pedidos a cada ${INTERVALO / 1000}s...`);

cicloDePrint();
setInterval(cicloDePrint, INTERVALO);
