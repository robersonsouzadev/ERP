import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Edit2, Plus, Power, PowerOff, CheckCircle2, X, Trash2 } from 'lucide-react';
import { funcionariosService, GrupoAcesso as GrupoAcessoType, GrupoAcessoPermissao } from '../lib/funcionarios';

const MODULES = [
  'Painel Executivo',
  'Clientes & Parceiros',
  'Catálogo de Produtos',
  'Caixa PDV',
  'Vendas',
  'Compras & Fornecedores',
  'Estoque',
  'Financeiro',
  'Liquidação de Títulos',
  'Renegociação',
  'Contas Bancárias',
  'DRE & Relatórios',
  'Configurações',
  'Usuários & Permissões'
] as const;

type ModuleName = typeof MODULES[number];

type Actions = {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  especial: boolean;
};

type PermissionsMatrix = Record<ModuleName, Actions>;

const defaultMatrix = (): PermissionsMatrix => {
  const matrix: Partial<PermissionsMatrix> = {};
  MODULES.forEach(m => {
    matrix[m] = { visualizar: false, criar: false, editar: false, excluir: false, especial: false };
  });
  return matrix as PermissionsMatrix;
};

const INITIAL_GRUPOS: GrupoAcessoType[] = [
  { id: '1', nome: 'Administrador', descricao: 'Acesso total ao sistema', is_sistema: 1, ativo: 1, percentual_max_desconto: 100, total_usuarios: 2 },
  { id: '2', nome: 'Gerente', descricao: 'Acesso gerencial com restrições', is_sistema: 0, ativo: 1, percentual_max_desconto: 15, total_usuarios: 3 },
];

export const GruposAcessoPage: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoAcessoType[]>(INITIAL_GRUPOS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoAcessoType | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [percentualMaxDesconto, setPercentualMaxDesconto] = useState<number>(0);
  const [ativo, setAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<PermissionsMatrix>(defaultMatrix());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const data = await funcionariosService.listarGrupos();
        if (data && data.length > 0) {
          setGrupos(data);
        }
      } catch (e) {
        console.error(e);
        showToast("Erro ao carregar grupos, usando dados locais.");
      }
    };
    fetchGrupos();
  }, []);

  const handleOpenModal = async (g?: GrupoAcessoType) => {
    if (g) {
      setEditingGrupo(g);
      setNome(g.nome);
      setDescricao(g.descricao || '');
      setPercentualMaxDesconto(g.percentual_max_desconto || 0);
      setAtivo(g.ativo === 1);
      
      try {
        const perms = await funcionariosService.listarPermissoesGrupo(g.id);
        const matrix = defaultMatrix();
        if (perms && perms.length > 0) {
          perms.forEach(p => {
            if (MODULES.includes(p.modulo as any)) {
              matrix[p.modulo as ModuleName] = {
                visualizar: p.pode_visualizar === 1,
                criar: p.pode_criar === 1,
                editar: p.pode_editar === 1,
                excluir: p.pode_excluir === 1,
                especial: p.pode_especial === 1,
              };
            }
          });
        }
        setPermissoes(matrix);
      } catch (e) {
        console.error(e);
        showToast('Erro ao carregar permissões do backend.');
        setPermissoes(defaultMatrix()); // fallback
      }
    } else {
      setEditingGrupo(null);
      setNome('');
      setDescricao('');
      setPercentualMaxDesconto(0);
      setAtivo(true);
      setPermissoes(defaultMatrix());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGrupo(null);
  };

  const matrixToPermissoes = (groupId: string, matrix: PermissionsMatrix): GrupoAcessoPermissao[] => {
    return MODULES.map(m => ({
      id: '',
      grupo_id: groupId,
      modulo: m,
      recurso: m,
      pode_visualizar: matrix[m].visualizar ? 1 : 0,
      pode_criar: matrix[m].criar ? 1 : 0,
      pode_editar: matrix[m].editar ? 1 : 0,
      pode_excluir: matrix[m].excluir ? 1 : 0,
      pode_especial: matrix[m].especial ? 1 : 0,
      escopo_dados: 'GLOBAL',
      pode_exportar: 0
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const grupoData: GrupoAcessoType = {
      id: editingGrupo ? editingGrupo.id : '',
      nome,
      descricao,
      is_sistema: editingGrupo ? editingGrupo.is_sistema : 0,
      ativo: ativo ? 1 : 0,
      percentual_max_desconto: percentualMaxDesconto,
      total_usuarios: editingGrupo ? editingGrupo.total_usuarios : 0
    };
    const perms = matrixToPermissoes(grupoData.id, permissoes);
    
    try {
      const saved = await funcionariosService.salvarGrupo(grupoData, perms);
      setGrupos(prev => {
        const exists = prev.find(g => g.id === saved.id);
        if (exists) return prev.map(g => g.id === saved.id ? saved : g);
        return [...prev, saved];
      });
      showToast('Grupo de acesso salvo com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar no backend. Alterando localmente.');
      // Local fallback
      const id = editingGrupo ? editingGrupo.id : String(Date.now());
      const newG = { ...grupoData, id };
      if (editingGrupo) {
        setGrupos(prev => prev.map(g => g.id === id ? newG : g));
      } else {
        setGrupos(prev => [...prev, newG]);
      }
    }
    handleCloseModal();
  };

  const handleToggleStatus = async (id: string) => {
    const g = grupos.find(x => x.id === id);
    if (!g) return;
    const novoAtivo = g.ativo === 1 ? 0 : 1;
    const updatedG = { ...g, ativo: novoAtivo };
    
    try {
      let perms: GrupoAcessoPermissao[] = [];
      try {
        perms = await funcionariosService.listarPermissoesGrupo(id);
      } catch (err) {}
      await funcionariosService.salvarGrupo(updatedG, perms);
      setGrupos(prev => prev.map(x => x.id === id ? updatedG : x));
      showToast('Status do grupo alterado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro no backend, alterado localmente!');
      setGrupos(prev => prev.map(x => x.id === id ? updatedG : x));
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir este grupo?')) return;
    try {
      await funcionariosService.excluirGrupo(id);
      setGrupos(prev => prev.filter(g => g.id !== id));
      showToast('Grupo excluído com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir no backend, excluído localmente.');
      setGrupos(prev => prev.filter(g => g.id !== id));
    }
  };

  const handlePermissionChange = (module: ModuleName, action: keyof Actions, value: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }));
  };

  return (
    <div className="coliseu-page">
      {toastMessage && (
        <div className="coliseu-toast-container">
          <div className="coliseu-toast coliseu-toast--success">
            <CheckCircle2 size={16} style={{ color: 'var(--status-success)' }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <PageHeader
        title="Grupos de Acesso & Permissões"
        description="Configuração de perfis de acesso, módulos permitidos e alçadas de autorização."
        breadcrumbItems={[
          { label: 'Administração', active: false },
          { label: 'Grupos de Acesso', active: true },
        ]}
        primaryAction={{
          label: 'Novo Grupo',
          onClick: () => handleOpenModal(),
          icon: <Plus size={14} aria-hidden="true" />,
        }}
      />

      <div className="coliseu-card">
        <div className="coliseu-table-container">
          <table className="coliseu-table">
            <thead>
              <tr>
                <th>Nome do Grupo</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'center' }}>Desc. Máx %</th>
                <th style={{ textAlign: 'center' }}>Nº Usuários</th>
                <th>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 500 }}>{g.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{g.descricao}</td>
                  <td style={{ textAlign: 'center' }}>{g.percentual_max_desconto}%</td>
                  <td style={{ textAlign: 'center' }}>{g.total_usuarios}</td>
                  <td>
                    <StatusBadge status={g.ativo === 1 ? 'success' : 'muted'} label={g.ativo === 1 ? 'Ativo' : 'Inativo'} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Button variant="ghost" onClick={() => handleOpenModal(g)} title="Editar">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" onClick={() => handleToggleStatus(g.id)} title={g.ativo === 1 ? 'Desativar' : 'Ativar'}>
                        {g.ativo === 1 ? <PowerOff size={14} color="var(--action-danger)" /> : <Power size={14} color="var(--status-success)" />}
                      </Button>
                      <Button variant="ghost" onClick={() => handleExcluir(g.id)} title="Excluir">
                        <Trash2 size={14} color="var(--action-danger)" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {grupos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Nenhum grupo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--surface-overlay-heavy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
        }}>
          <div style={{
            background: 'var(--surface-1)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{editingGrupo ? 'Editar Grupo de Acesso' : 'Novo Grupo de Acesso'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '20px' }}>
              <form id="grupo-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <fieldset style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', margin: 0 }}>
                  <legend style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 4px' }}>Dados do Grupo</legend>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="coliseu-label">Nome do Grupo *</label>
                      <input 
                        type="text" 
                        className="coliseu-input" 
                        value={nome} 
                        onChange={e => setNome(e.target.value)} 
                        required 
                        style={{ height: '38px', width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="coliseu-label">Descrição</label>
                      <input 
                        type="text" 
                        className="coliseu-input" 
                        value={descricao} 
                        onChange={e => setDescricao(e.target.value)} 
                        style={{ height: '38px', width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="coliseu-label">Desconto Máximo %</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="coliseu-input" 
                        value={percentualMaxDesconto} 
                        onChange={e => setPercentualMaxDesconto(Number(e.target.value))} 
                        style={{ height: '38px', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <input 
                      type="checkbox" 
                      id="ativo-checkbox"
                      checked={ativo}
                      onChange={e => setAtivo(e.target.checked)}
                    />
                    <label htmlFor="ativo-checkbox" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Grupo Ativo
                    </label>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Matriz de Permissões</h3>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <tr>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Módulo</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Visualizar</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Criar</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Editar</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Excluir</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Especial*</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES.map((modulo, index) => (
                          <tr key={modulo} style={{ backgroundColor: index % 2 === 0 ? 'var(--surface-1)' : 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 16px', fontWeight: 500 }}>{modulo}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={permissoes[modulo].visualizar}
                                onChange={(e) => handlePermissionChange(modulo, 'visualizar', e.target.checked)}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={permissoes[modulo].criar}
                                onChange={(e) => handlePermissionChange(modulo, 'criar', e.target.checked)}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={permissoes[modulo].editar}
                                onChange={(e) => handlePermissionChange(modulo, 'editar', e.target.checked)}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={permissoes[modulo].excluir}
                                onChange={(e) => handlePermissionChange(modulo, 'excluir', e.target.checked)}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={permissoes[modulo].especial}
                                onChange={(e) => handlePermissionChange(modulo, 'especial', e.target.checked)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    * Especial refere-se a ações sensíveis como: Conceder Desconto, Cancelar Venda, Autorizar Renegociação, Liberar Limite de Crédito.
                  </p>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: 'var(--surface-2)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
              <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancelar</Button>
              <Button variant="primary" type="submit" form="grupo-form">Salvar Grupo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
