import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/formatters';
import {
  Truck,
  Send,
  Plus,
  CheckCircle2,
  X,
  FileText,
  MapPin,
  User,
  Package,
} from 'lucide-react';
import {
  DocumentoFiscalItem,
  salvarDocumentoFiscal,
  getDocumentosFiscais,
} from '../../lib/dfe';
import { getCertificadoConfig } from '../../lib/certificadoA1';

interface ModalEmissaoMDFeProps {
  isOpen: boolean;
  onClose: () => void;
  onEmissaoSucesso: (doc: DocumentoFiscalItem) => void;
}

export const ModalEmissaoMDFe: React.FC<ModalEmissaoMDFeProps> = ({
  isOpen,
  onClose,
  onEmissaoSucesso,
}) => {
  const certConfig = getCertificadoConfig();
  const todosDocumentos = getDocumentosFiscais();
  const nfeAutorizadas = todosDocumentos.filter(
    (d) => d.modelo === '55_NFE' && d.statusSefaz === 'AUTORIZADA'
  );

  // Estados do MDF-e
  const [ufCarregamento, setUfCarregamento] = useState('MS');
  const [municipioCarregamento, setMunicipioCarregamento] = useState('DOURADOS');
  const [ufDescarregamento, setUfDescarregamento] = useState('MS');
  const [municipioDescarregamento, setMunicipioDescarregamento] = useState('CAMPO GRANDE');

  // Veículo & Motorista
  const [placaVeiculo, setPlacaVeiculo] = useState('RTE-8A99');
  const [renavamVeiculo, setRenavamVeiculo] = useState('01298371892');
  const [rntrc, setRntrc] = useState(certConfig.rntrcEmpresa || '09812345');
  const [motoristaNome, setMotoristaNome] = useState('JOAO PEDRO DE OLIVEIRA');
  const [motoristaCpf, setMotoristaCpf] = useState('123.456.789-00');
  const [pesoBrutoCargaKg, setPesoBrutoCargaKg] = useState<number>(1850.50);

  // Seleção de NF-e vinculadas
  const [chavesSelecionadas, setChavesSelecionadas] = useState<string[]>(() =>
    nfeAutorizadas.slice(0, 2).map((n) => n.chaveAcesso)
  );

  const [isTransmitting, setIsTransmitting] = useState(false);

  if (!isOpen) return null;

  // Valor total da carga somado das NF-es selecionadas
  const valorTotalCarga = nfeAutorizadas
    .filter((n) => chavesSelecionadas.includes(n.chaveAcesso))
    .reduce((acc, n) => acc + n.valorTotal, 0);

  const toggleChave = (chave: string) => {
    if (chavesSelecionadas.includes(chave)) {
      setChavesSelecionadas(chavesSelecionadas.filter((c) => c !== chave));
    } else {
      setChavesSelecionadas([...chavesSelecionadas, chave]);
    }
  };

  const handleTransmitirMDFe = () => {
    if (!placaVeiculo || !motoristaNome || !motoristaCpf) {
      alert('Preencha os dados do Veículo e do Condutor.');
      return;
    }
    if (chavesSelecionadas.length === 0) {
      alert('Vincule pelo menos 1 NF-e ao Manifesto de Carga.');
      return;
    }

    setIsTransmitting(true);

    setTimeout(() => {
      setIsTransmitting(false);

      const proximoNumero = certConfig.mdfeNumeroAtual + 1;
      const serie = certConfig.mdfeSerie;
      const chaveAcesso = `5026081234567800019058${String(serie).padStart(3, '0')}${String(proximoNumero).padStart(9, '0')}1${Math.floor(10000000 + Math.random() * 90000000)}`;

      const novoDoc: DocumentoFiscalItem = {
        id: `DFE-MDFE-${Date.now()}`,
        modelo: '58_MDFE',
        numero: proximoNumero,
        serie,
        chaveAcesso,
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        horaEmissao: new Date().toLocaleTimeString('pt-BR'),
        naturezaOperacao: 'TRANSPORTE DE CARGA PROPRIA OU TERCEIROS',
        tipoOperacao: 'SAIDA',
        destinatarioNome: `TRANSPORTE ${ufCarregamento} ➔ ${ufDescarregamento}`,
        destinatarioCpfCnpj: certConfig.cnpjTitular,
        destinatarioUf: ufDescarregamento,
        destinatarioMunicipio: municipioDescarregamento.toUpperCase(),
        valorProdutos: valorTotalCarga,
        valorFrete: 0,
        valorSeguro: 0,
        valorOutrasDespesas: 0,
        valorDesconto: 0,
        valorTotal: valorTotalCarga,
        valorBaseIcms: 0,
        valorIcms: 0,
        valorIcmsSt: 0,
        valorIpi: 0,
        valorPis: 0,
        valorCofins: 0,
        statusSefaz: 'AUTORIZADA',
        mensagemSefaz: '100 - Autorizado o uso do MDF-e (Manifesto Eletrônico de Carga)',
        protocoloAutorizacao: `15026000${Math.floor(100000 + Math.random() * 900000)}`,
        dataAutorizacao: new Date().toLocaleString('pt-BR'),
        cartasCorrecao: [],
        itens: [],
        dadosMdfe: {
          ufCarregamento,
          municipioCarregamento: municipioCarregamento.toUpperCase(),
          ufDescarregamento,
          municipioDescarregamento: municipioDescarregamento.toUpperCase(),
          placaVeiculo: placaVeiculo.toUpperCase(),
          renavamVeiculo,
          rntrc,
          motoristaNome: motoristaNome.toUpperCase(),
          motoristaCpf,
          pesoBrutoCargaKg,
          valorTotalCarga,
          chavesNfeVinculadas: chavesSelecionadas,
        },
      };

      salvarDocumentoFiscal(novoDoc);
      onEmissaoSucesso(novoDoc);
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={20} color="#f59e0b" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Emissão de MDF-e (Manifesto Eletrônico de Carga — Modelo 58)
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Vinculação de NF-es, dados de tração, condutor e rota de transporte para fiscalização SEFAZ/ANTT.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Percurso e Rota */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#f59e0b" /> Rota & Percurso do Transporte
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 80px 1.5fr', gap: '10px' }}>
              <div>
                <label className="coliseu-label">UF Origem *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={ufCarregamento}
                  onChange={(e) => setUfCarregamento(e.target.value.toUpperCase())}
                  maxLength={2}
                  style={{ height: '36px', width: '100%', textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <div>
                <label className="coliseu-label">Município de Carregamento *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={municipioCarregamento}
                  onChange={(e) => setMunicipioCarregamento(e.target.value.toUpperCase())}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
              <div>
                <label className="coliseu-label">UF Destino *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={ufDescarregamento}
                  onChange={(e) => setUfDescarregamento(e.target.value.toUpperCase())}
                  maxLength={2}
                  style={{ height: '36px', width: '100%', textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <div>
                <label className="coliseu-label">Município de Descarregamento *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={municipioDescarregamento}
                  onChange={(e) => setMunicipioDescarregamento(e.target.value.toUpperCase())}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Veículo de Tração & Condutor */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={15} color="#f59e0b" /> Veículo de Tração & Condutor (Motorista)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 140px 1.5fr 140px', gap: '10px' }}>
              <div>
                <label className="coliseu-label">Placa *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={placaVeiculo}
                  onChange={(e) => setPlacaVeiculo(e.target.value.toUpperCase())}
                  style={{ height: '36px', width: '100%', fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <div>
                <label className="coliseu-label">RENAVAM</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={renavamVeiculo}
                  onChange={(e) => setRenavamVeiculo(e.target.value)}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
              <div>
                <label className="coliseu-label">RNTRC (ANTT)</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={rntrc}
                  onChange={(e) => setRntrc(e.target.value)}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
              <div>
                <label className="coliseu-label">Nome do Motorista *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={motoristaNome}
                  onChange={(e) => setMotoristaNome(e.target.value.toUpperCase())}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
              <div>
                <label className="coliseu-label">CPF Motorista *</label>
                <input
                  type="text"
                  className="coliseu-input"
                  value={motoristaCpf}
                  onChange={(e) => setMotoristaCpf(e.target.value)}
                  style={{ height: '36px', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
              <div>
                <label className="coliseu-label">Peso Bruto Total (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="coliseu-input"
                  value={pesoBrutoCargaKg}
                  onChange={(e) => setPesoBrutoCargaKg(parseFloat(e.target.value) || 0)}
                  style={{ height: '36px', width: '100%', textAlign: 'right', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                ℹ️ O peso bruto e o valor total serão calculados e validados no Posto Fiscal da SEFAZ na passagem da carga.
              </div>
            </div>
          </div>

          {/* Seleção de Notas Fiscais (NF-e) Transportadas */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Selecione as NF-e (Mod. 55) que estão sendo transportadas no veículo ({chavesSelecionadas.length} selecionadas):
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                Valor Total da Carga: {formatCurrency(valorTotalCarga)}
              </span>
            </div>

            <div className="coliseu-table-container">
              <table className="coliseu-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>Vincular</th>
                    <th style={{ width: '90px' }}>Nº NF-e</th>
                    <th style={{ width: '100px' }}>Data Emissão</th>
                    <th>Destinatário</th>
                    <th style={{ width: '80px' }}>Destino</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Valor Total</th>
                    <th>Chave de Acesso NF-e</th>
                  </tr>
                </thead>
                <tbody>
                  {nfeAutorizadas.map((nfe) => {
                    const isChecked = chavesSelecionadas.includes(nfe.chaveAcesso);

                    return (
                      <tr
                        key={nfe.id}
                        style={{
                          backgroundColor: isChecked ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChave(nfe.chaveAcesso)}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-link)' }}>NF-e {nfe.numero}</td>
                        <td>{nfe.dataEmissao}</td>
                        <td style={{ fontWeight: 600 }}>{nfe.destinatarioNome}</td>
                        <td>{nfe.destinatarioMunicipio}/{nfe.destinatarioUf}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                          {formatCurrency(nfe.valorTotal)}
                        </td>
                        <td className="text-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {nfe.chaveAcesso}
                        </td>
                      </tr>
                    );
                  })}
                  {nfeAutorizadas.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Nenhuma NF-e modelo 55 autorizada encontrada para inclusão no manifesto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total de {chavesSelecionadas.length} NF-e(s) • Carga: <strong style={{ color: '#10b981' }}>{formatCurrency(valorTotalCarga)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose} disabled={isTransmitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleTransmitirMDFe}
              disabled={isTransmitting}
              leftIcon={<Send size={16} />}
            >
              {isTransmitting ? 'Transmitindo MDF-e...' : 'Transmitir MDF-e e Gerar DAMDFE (F10)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
