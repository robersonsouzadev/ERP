import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AIInsight } from '../components/ui/AIComponents';
import { Search, UserPlus, Shield, Key, CheckCircle2, X, Check, Lock, Unlock } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
}

const INITIAL_USUARIOS: Usuario[] = [
  { id: 'USR-01', nome: 'Carlos Eduardo Piveta', email: 'carlos@piveta.com.br', perfil: 'Administrador / Diretoria', status: 'Ativo' },
  { id: 'USR-02', nome: 'Mariana Santos', email: 'mariana@piveta.com.br', perfil: 'Operador de Caixa PDV', status: 'Ativo' },
  { id: 'USR-03', nome: 'Roberto Silenus', email: 'silenus@piveta.com.br', perfil: 'Gerente Financeiro & Fiscal', status: 'Ativo' },
  { id: 'USR-04', nome: 'Lucas Ferreira', email: 'lucas@piveta.com.br', perfil: 'Estoquista / Logística', status: 'Ativo' },
];

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoPerfil, setNovoPerfil] = useState('Vendedor / Balcão');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSalvarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim()) {
      showToast('⚠️ Preencha o nome e o e-mail do usuário.');
      return;
    }

    const novoUser: Usuario = {
      id: `USR-${(usuarios.length + 1).toString().padStart(2, '0')}`,
      nome: novoNome.trim(),
      email: novoEmail.trim().toLowerCase(),
      perfil: novoPerfil,
      status: 'Ativo',
    };

    setUsuarios((prev) => [...prev, novoUser]);
    setIsModalOpen(false);
    setNovoNome('');
    setNovoEmail('');
    showToast(`✅ Usuário '${novoUser.nome}' cadastrado com perfil '${novoUser.perfil}'!`);
  };

  const handleToggleStatus = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
          showToast(`👤 Usuário ${u.nome} agora está ${newStatus}.`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const filteredUsuarios = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.perfil.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [usuarios, searchTerm]);

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
        title="Gestão de Usuários & Matriz de Permissões RBAC"
        description="Controle de acesso por perfil, matriz de permissões por módulo e logs de autenticação."
        breadcrumbItems={[
          { label: 'Administração', active: false },
          { label: 'Usuários & RBAC', active: true },
        ]}
        primaryAction={{
          label: 'Novo Usuário',
          onClick: () => setIsModalOpen(true),
          icon: <UserPlus size={14} aria-hidden="true" />,
        }}
      />

      <div className="coliseu-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '360px' }}>
          <Input
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={14} aria-hidden="true" />}
          />
        </div>

        <div className="coliseu-table-container">
          <table className="coliseu-table">
            <thead>
              <tr>
                <th>ID Usuário</th>
                <th>Nome do Operador</th>
                <th>E-mail de Acesso</th>
                <th>Perfil RBAC</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center', width: '110px' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--action-primary)', fontFamily: 'var(--font-family-mono)', fontSize: '11px' }}>
                    {u.id}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {u.perfil}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge status={u.status} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id)}
                      className="coliseu-btn coliseu-btn-secondary coliseu-btn--sm"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                      title={u.status === 'Ativo' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                    >
                      {u.status === 'Ativo' ? <Lock size={11} /> : <Unlock size={11} />}
                      <span>{u.status === 'Ativo' ? 'Bloquear' : 'Ativar'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIInsight
        title="Auditoria de Segurança RBAC & Autenticação"
        message="Todos os hashes de senha são derivados usando o algoritmo de alto custo Argon2id com isolamento local e sem ocorrência de tentativas de força bruta detectadas."
      />

      {/* Modal Novo Usuário */}
      {isModalOpen && (
        <>
          <div className="coliseu-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="coliseu-modal coliseu-modal--md" style={{ padding: 'var(--spacing-4)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-3)',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Cadastro de Novo Usuário / Operador
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSalvarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="coliseu-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="coliseu-input"
                />
              </div>

              <div>
                <label className="coliseu-label">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="joao@piveta.com.br"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  className="coliseu-input"
                />
              </div>

              <div>
                <label className="coliseu-label">Perfil de Acesso (RBAC) *</label>
                <select
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value)}
                  className="coliseu-input"
                >
                  <option value="Administrador / Diretoria">Administrador / Diretoria</option>
                  <option value="Gerente Financeiro & Fiscal">Gerente Financeiro & Fiscal</option>
                  <option value="Vendedor / Balcão">Vendedor / Balcão</option>
                  <option value="Operador de Caixa PDV">Operador de Caixa PDV</option>
                  <option value="Estoquista / Logística">Estoquista / Logística</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="coliseu-btn coliseu-btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="coliseu-btn coliseu-btn-primary">
                  <Check size={14} />
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
