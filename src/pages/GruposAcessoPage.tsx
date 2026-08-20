import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Edit2, Plus, Power, PowerOff, CheckCircle2, X } from 'lucide-react';

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

interface GrupoAcesso {
  id: string;
  nome: string;
  descricao: string;
  usuarios: number;
  ativo: boolean;
  permissoes: PermissionsMatrix;
}

const defaultMatrix = (): PermissionsMatrix => {
  const matrix: Partial<PermissionsMatrix> = {};
  MODULES.forEach(m => {
    matrix[m] = { visualizar: false, criar: false, editar: false, excluir: false, especial: false };
  });
  return matrix as PermissionsMatrix;
};

const adminMatrix = (): PermissionsMatrix => {
  const matrix: Partial<PermissionsMatrix> = {};
  MODULES.forEach(m => {
    matrix[m] = { visualizar: true, criar: true, editar: true, excluir: true, especial: true };
  });
  return matrix as PermissionsMatrix;
};

const pdvMatrix = (): PermissionsMatrix => {
  const matrix = defaultMatrix();
  matrix['Caixa PDV'] = { visualizar: true, criar: true, editar: false, excluir: false, especial: false };
  matrix['Vendas'] = { visualizar: true, criar: false, editar: false, excluir: false, especial: false };
  matrix['Clientes & Parceiros'] = { visualizar: true, criar: false, editar: false, excluir: false, especial: false };
  return matrix;
};

export const GruposAcessoPage: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoAcesso[]>([
    { id: '1', nome: 'Administrador', descricao: 'Acesso total ao sistema', usuarios: 2, ativo: true, permissoes: adminMatrix() },
    { id: '2', nome: 'Gerente', descricao: 'Acesso gerencial com restrições financeiras', usuarios: 3, ativo: true, permissoes: defaultMatrix() },
    { id: '3', nome: 'Operador PDV', descricao: 'Acesso restrito ao módulo de vendas e caixa', usuarios: 5, ativo: true, permissoes: pdvMatrix() },
    { id: '4', nome: 'Financeiro', descricao: 'Acesso ao módulo financeiro, contas e relatórios', usuarios: 2, ativo: true, permissoes: defaultMatrix() },
    { id: '5', nome: 'Estoquista', descricao: 'Acesso restrito ao módulo de estoque e produtos', usuarios: 3, ativo: true, permissoes: defaultMatrix() },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoAcesso | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<PermissionsMatrix>(defaultMatrix());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenModal = (g?: GrupoAcesso) => {
    if (g) {
      setEditingGrupo(g);
      setNome(g.nome);
      setDescricao(g.descricao);
      setAtivo(g.ativo);
      setPermissoes(JSON.parse(JSON.stringify(g.permissoes))); // deep copy
    } else {
      setEditingGrupo(null);
      setNome('');
      setDescricao('');
      setAtivo(true);
      setPermissoes(defaultMatrix());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGrupo(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrupo) {
      setGrupos(grupos.map(g => g.id === editingGrupo.id ? { ...g, nome, descricao, ativo, permissoes } : g));
      showToast('Grupo de acesso atualizado com sucesso!');
    } else {
      const newGrupo: GrupoAcesso = {
        id: String(Date.now()),
        nome,
        descricao,
        usuarios: 0,
        ativo,
        permissoes,
      };
      setGrupos([...grupos, newGrupo]);
      showToast('Grupo de acesso criado com sucesso!');
    }
    handleCloseModal();
  };

  const handleToggleStatus = (id: string) => {
    setGrupos(grupos.map(g => g.id === id ? { ...g, ativo: !g.ativo } : g));
    showToast('Status do grupo alterado com sucesso!');
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
                <th style={{ textAlign: 'center' }}>Nº Usuários</th>
                <th>Status</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 500 }}>{g.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{g.descricao}</td>
                  <td style={{ textAlign: 'center' }}>{g.usuarios}</td>
                  <td>
                    <StatusBadge status={g.ativo ? 'success' : 'muted'} label={g.ativo ? 'Ativo' : 'Inativo'} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Button variant="ghost" onClick={() => handleOpenModal(g)} title="Editar">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" onClick={() => handleToggleStatus(g.id)} title={g.ativo ? 'Desativar' : 'Ativar'}>
                        {g.ativo ? <PowerOff size={14} color="var(--action-danger)" /> : <Power size={14} color="var(--status-success)" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {grupos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
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
