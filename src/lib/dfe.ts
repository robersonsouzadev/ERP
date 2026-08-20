// Gerenciador e modelo de dados de Documentos Fiscais Eletrônicos (NF-e 55, NFC-e 65, MDF-e 58)

export type ModeloDFe = '55_NFE' | '65_NFCE' | '58_MDFE';

export type StatusSefaz =
  | 'AUTORIZADA'
  | 'CANCELADA'
  | 'DENEGADA'
  | 'EM_PROCESSAMENTO'
  | 'CONTINGENCIA'
  | 'ENCERRADO';

export interface CartaCorrecaoItem {
  id: string;
  sequencial: number;
  dataHora: string;
  textoCorrecao: string;
  protocolo: string;
}

export interface ItemDFe {
  id: string;
  sku: string;
  descricao: string;
  ncm: string;
  cfop: string;
  cst: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  aliquotaIcms: number;
  valorIcms: number;
}

export interface DocumentoFiscalItem {
  id: string;
  modelo: ModeloDFe;
  numero: number;
  serie: number;
  chaveAcesso: string;
  dataEmissao: string;
  horaEmissao: string;
  naturezaOperacao: string;
  tipoOperacao: 'SAIDA' | 'ENTRADA';
  
  // Destinatário
  destinatarioNome: string;
  destinatarioCpfCnpj: string;
  destinatarioUf: string;
  destinatarioMunicipio: string;
  
  // Valores Fiscais
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  valorOutrasDespesas: number;
  valorDesconto: number;
  valorTotal: number;
  
  valorBaseIcms: number;
  valorIcms: number;
  valorIcmsSt: number;
  valorIpi: number;
  valorPis: number;
  valorCofins: number;
  
  // Status & SEFAZ
  statusSefaz: StatusSefaz;
  mensagemSefaz: string;
  protocoloAutorizacao?: string;
  dataAutorizacao?: string;
  motivoCancelamento?: string;
  dataCancelamento?: string;
  
  // Eventos de Carta de Correção (CC-e)
  cartasCorrecao: CartaCorrecaoItem[];
  
  // Itens
  itens: ItemDFe[];
  
  // Específicos para MDF-e (Modelo 58 - Manifesto de Carga)
  dadosMdfe?: {
    ufCarregamento: string;
    municipioCarregamento: string;
    ufDescarregamento: string;
    municipioDescarregamento: string;
    placaVeiculo: string;
    renavamVeiculo: string;
    rntrc: string;
    motoristaNome: string;
    motoristaCpf: string;
    pesoBrutoCargaKg: number;
    valorTotalCarga: number;
    chavesNfeVinculadas: string[];
    dataEncerramento?: string;
    protocoloEncerramento?: string;
  };
}

const STORAGE_KEY_DFE = 'coliseu_documentos_fiscais_dfe';

const DEFAULT_DOCUMENTOS: DocumentoFiscalItem[] = [
  {
    id: 'DFE-1',
    modelo: '55_NFE',
    numero: 1042,
    serie: 1,
    chaveAcesso: '50260812345678000190550010000010421892189214',
    dataEmissao: '18/08/2026',
    horaEmissao: '10:15:00',
    naturezaOperacao: 'VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS',
    tipoOperacao: 'SAIDA',
    destinatarioNome: 'AGROPECUARIA PANTANAL LTDA',
    destinatarioCpfCnpj: '12.345.678/0001-90',
    destinatarioUf: 'MS',
    destinatarioMunicipio: 'DOURADOS',
    valorProdutos: 3850.00,
    valorFrete: 150.00,
    valorSeguro: 0,
    valorOutrasDespesas: 0,
    valorDesconto: 0,
    valorTotal: 4000.00,
    valorBaseIcms: 4000.00,
    valorIcms: 480.00,
    valorIcmsSt: 0,
    valorIpi: 0,
    valorPis: 26.00,
    valorCofins: 120.00,
    statusSefaz: 'AUTORIZADA',
    mensagemSefaz: '100 - Autorizado o uso da NF-e',
    protocoloAutorizacao: '150260009812344',
    dataAutorizacao: '18/08/2026 10:15:12',
    cartasCorrecao: [],
    itens: [
      { id: 'IT-1', sku: '00001', descricao: 'TINTA POLIURETANO AUTOMOTIVA 900ML', ncm: '32082019', cfop: '5102', cst: '000', quantidade: 20, unidade: 'UN', valorUnitario: 120.00, valorTotal: 2400.00, aliquotaIcms: 12, valorIcms: 288.00 },
      { id: 'IT-2', sku: '00002', descricao: 'VERNIZ ALTO SÓLIDOS 5:1 900ML', ncm: '32089010', cfop: '5102', cst: '000', quantidade: 10, unidade: 'UN', valorUnitario: 145.00, valorTotal: 1450.00, aliquotaIcms: 12, valorIcms: 174.00 },
    ],
  },
  {
    id: 'DFE-2',
    modelo: '65_NFCE',
    numero: 3820,
    serie: 1,
    chaveAcesso: '50260812345678000190650010000038201928374821',
    dataEmissao: '18/08/2026',
    horaEmissao: '11:45:20',
    naturezaOperacao: 'VENDA A CONSUMIDOR FINAL',
    tipoOperacao: 'SAIDA',
    destinatarioNome: 'CONSUMIDOR NAO IDENTIFICADO',
    destinatarioCpfCnpj: '000.000.000-00',
    destinatarioUf: 'MS',
    destinatarioMunicipio: 'DOURADOS',
    valorProdutos: 185.00,
    valorFrete: 0,
    valorSeguro: 0,
    valorOutrasDespesas: 0,
    valorDesconto: 5.00,
    valorTotal: 180.00,
    valorBaseIcms: 180.00,
    valorIcms: 21.60,
    valorIcmsSt: 0,
    valorIpi: 0,
    valorPis: 1.17,
    valorCofins: 5.40,
    statusSefaz: 'AUTORIZADA',
    mensagemSefaz: '100 - Autorizado o uso da NFC-e',
    protocoloAutorizacao: '150260009812999',
    dataAutorizacao: '18/08/2026 11:45:22',
    cartasCorrecao: [],
    itens: [
      { id: 'IT-10', sku: '00010', descricao: 'THINNER DILUENTE PU 5000 5L', ncm: '38140090', cfop: '5102', cst: '000', quantidade: 2, unidade: 'UN', valorUnitario: 92.50, valorTotal: 185.00, aliquotaIcms: 12, valorIcms: 21.60 },
    ],
  },
  {
    id: 'DFE-3',
    modelo: '58_MDFE',
    numero: 128,
    serie: 1,
    chaveAcesso: '50260812345678000190580010000001281098234712',
    dataEmissao: '18/08/2026',
    horaEmissao: '12:00:00',
    naturezaOperacao: 'TRANSPORTE DE CARGA PROPRIA ENTRE FILIAIS E CLIENTES',
    tipoOperacao: 'SAIDA',
    destinatarioNome: 'CARGA MULTIPLA - MATO GROSSO DO SUL',
    destinatarioCpfCnpj: '12.345.678/0001-90',
    destinatarioUf: 'MS',
    destinatarioMunicipio: 'DOURADOS',
    valorProdutos: 4000.00,
    valorFrete: 0,
    valorSeguro: 0,
    valorOutrasDespesas: 0,
    valorDesconto: 0,
    valorTotal: 4000.00,
    valorBaseIcms: 0,
    valorIcms: 0,
    valorIcmsSt: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    statusSefaz: 'AUTORIZADA',
    mensagemSefaz: '100 - Autorizado o uso do MDF-e (Manifesto Eletrônico)',
    protocoloAutorizacao: '150260009819888',
    dataAutorizacao: '18/08/2026 12:00:15',
    cartasCorrecao: [],
    itens: [],
    dadosMdfe: {
      ufCarregamento: 'MS',
      municipioCarregamento: 'DOURADOS',
      ufDescarregamento: 'MS',
      municipioDescarregamento: 'CAMPO GRANDE',
      placaVeiculo: 'RTE-8A99',
      renavamVeiculo: '01298371892',
      rntrc: '09812345',
      motoristaNome: 'JOAO PEDRO DE OLIVEIRA',
      motoristaCpf: '123.456.789-00',
      pesoBrutoCargaKg: 1850.50,
      valorTotalCarga: 4000.00,
      chavesNfeVinculadas: [
        '50260812345678000190550010000010421892189214',
      ],
    },
  },
];

export function getDocumentosFiscais(): DocumentoFiscalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DFE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DFE, JSON.stringify(DEFAULT_DOCUMENTOS));
      return DEFAULT_DOCUMENTOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DOCUMENTOS;
  } catch {
    return DEFAULT_DOCUMENTOS;
  }
}

export function salvarDocumentoFiscal(doc: DocumentoFiscalItem): DocumentoFiscalItem[] {
  const lista = getDocumentosFiscais();
  const index = lista.findIndex((item) => item.id === doc.id);
  let atualizada: DocumentoFiscalItem[];

  if (index >= 0) {
    atualizada = [...lista];
    atualizada[index] = doc;
  } else {
    atualizada = [doc, ...lista];
  }

  localStorage.setItem(STORAGE_KEY_DFE, JSON.stringify(atualizada));
  window.dispatchEvent(new Event('coliseu_dfe_updated'));
  return atualizada;
}

export function emitirCartaCorrecao(docId: string, textoCorrecao: string): DocumentoFiscalItem | null {
  const lista = getDocumentosFiscais();
  const index = lista.findIndex((item) => item.id === docId);
  if (index < 0) return null;

  const doc = lista[index];
  const seq = doc.cartasCorrecao.length + 1;
  const cc: CartaCorrecaoItem = {
    id: `CC-${Date.now()}`,
    sequencial: seq,
    dataHora: new Date().toLocaleString('pt-BR'),
    textoCorrecao: textoCorrecao.toUpperCase(),
    protocolo: `15026000${Math.floor(100000 + Math.random() * 900000)}`,
  };

  doc.cartasCorrecao.push(cc);
  salvarDocumentoFiscal(doc);
  return doc;
}

export function cancelarDocumentoFiscal(docId: string, motivo: string): DocumentoFiscalItem | null {
  const lista = getDocumentosFiscais();
  const index = lista.findIndex((item) => item.id === docId);
  if (index < 0) return null;

  const doc = lista[index];
  doc.statusSefaz = 'CANCELADA';
  doc.motivoCancelamento = motivo.toUpperCase();
  doc.dataCancelamento = new Date().toLocaleString('pt-BR');
  doc.mensagemSefaz = '101 - Cancelamento de NF-e homologado';

  salvarDocumentoFiscal(doc);
  return doc;
}

export function encerrarMDFe(docId: string): DocumentoFiscalItem | null {
  const lista = getDocumentosFiscais();
  const index = lista.findIndex((item) => item.id === docId);
  if (index < 0) return null;

  const doc = lista[index];
  if (doc.modelo !== '58_MDFE' || !doc.dadosMdfe) return null;

  doc.statusSefaz = 'ENCERRADO';
  doc.dadosMdfe.dataEncerramento = new Date().toLocaleString('pt-BR');
  doc.dadosMdfe.protocoloEncerramento = `15026000${Math.floor(100000 + Math.random() * 900000)}`;
  doc.mensagemSefaz = '132 - Encerramento de MDF-e homologado com sucesso';

  salvarDocumentoFiscal(doc);
  return doc;
}
