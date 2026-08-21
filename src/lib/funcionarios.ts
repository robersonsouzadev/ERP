import { invoke } from "@tauri-apps/api/core";

// ==================== TYPES ====================

export type TipoFuncionario = 
  | 'USUARIO' | 'FUNCIONARIO' | 'VENDEDOR' | 'MOTORISTA' 
  | 'RESP_TECNICO' | 'ENCARREGADO' | 'REPRESENTANTE';

export type StatusFuncionario = 
  | 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | 'FERIAS' | 'AFASTADO' | 'DEMITIDO';

export type TipoVendedor = 'INTERNO' | 'EXTERNO_PJ' | 'REPRESENTANTE';

export type TipoCalculoComissao = 
  | 'PERCENTUAL_DIRETO' | 'MARGEM_LUCRO' | 'POR_CATEGORIA' | 'ESCALONADO';

export interface Funcionario {
  id: string;
  codigo: string;
  nome: string;
  apelido?: string;
  tipo_pessoa: string;
  cpf_cnpj?: string;
  rg?: string;
  cnh?: string;
  data_nascimento?: string;
  estado_civil?: string;
  genero?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  observacoes?: string;
  // Profissional
  tipo_funcionario: TipoFuncionario;
  cargo?: string;
  departamento?: string;
  salario: number;
  data_admissao?: string;
  data_demissao?: string;
  formacao?: string;
  pis_pasep?: string;
  ctps_numero?: string;
  ctps_serie?: string;
  // Acesso
  username?: string;
  grupo_acesso_id?: string;
  grupo_acesso_nome?: string;
  tem_acesso_sistema: number;
  status: StatusFuncionario;
  forcar_troca_senha: number;
  data_validade_acesso?: string;
  ultimo_login?: string;
  tentativas_login_falhas: number;
  // Comissões
  vendedor_codigo?: string;
  tipo_vendedor?: string;
  comissao_percentual: number;
  comissao_tipo_calculo: string;
  comissao_libera_emissao_pct: number;
  comissao_libera_baixa_pct: number;
  comissao_desconta_icms: number;
  comissao_desconta_pis_cofins: number;
  comissao_inclui_ipi: number;
  comissao_dia_pagamento: number;
  supervisor_id?: string;
  gerente_id?: string;
  desconto_maximo_permitido: number;
  banco_favorecido?: string;
  agencia?: string;
  conta_corrente?: string;
  chave_pix?: string;
  // Multi-filial
  empresa_id: string;
  filial_padrao_id?: string;
  acesso_todas_empresas: number;
  caixa_pdv_vinculado?: string;
}

export interface GrupoAcesso {
  id: string;
  nome: string;
  descricao?: string;
  is_sistema: number;
  ativo: number;
  percentual_max_desconto: number;
  total_usuarios: number;
}

export interface GrupoAcessoPermissao {
  id: string;
  grupo_id: string;
  modulo: string;
  recurso: string;
  pode_visualizar: number;
  pode_criar: number;
  pode_editar: number;
  pode_excluir: number;
  pode_especial: number;
  escopo_dados: string;
  pode_exportar: number;
}

export interface FuncionarioMeta {
  id: string;
  funcionario_id: string;
  tipo_periodo: string;
  ano: number;
  periodo: number;
  meta_faturamento: number;
  meta_quantidade: number;
  meta_margem_minima: number;
  meta_novos_clientes: number;
  categoria_produto_id?: string;
}

export interface FuncionarioFilial {
  id: string;
  funcionario_id: string;
  empresa_id: string;
  filial_id?: string;
  is_default: number;
}

export interface LoginResult {
  funcionario: Funcionario;
  permissoes: GrupoAcessoPermissao[];
  filiais_permitidas: FuncionarioFilial[];
}

// ==================== SERVICE ====================

export const funcionariosService = {
  async autenticar(username: string, senha: string): Promise<LoginResult> {
    return await invoke<LoginResult>("autenticar_funcionario", { username, senha });
  },

  async listar(empresaId: string): Promise<Funcionario[]> {
    return await invoke<Funcionario[]>("listar_funcionarios", { empresaId });
  },

  async salvar(funcionario: Funcionario, senhaPlain?: string): Promise<Funcionario> {
    return await invoke<Funcionario>("salvar_funcionario", { funcionario, senhaPlain });
  },

  async bloquear(funcionarioId: string): Promise<void> {
    return await invoke<void>("bloquear_funcionario", { funcionarioId });
  },

  async desbloquear(funcionarioId: string): Promise<void> {
    return await invoke<void>("desbloquear_funcionario", { funcionarioId });
  },

  async resetarSenha(funcionarioId: string, novaSenha: string): Promise<void> {
    return await invoke<void>("resetar_senha_funcionario", { funcionarioId, novaSenha });
  },

  // Grupos de Acesso
  async listarGrupos(): Promise<GrupoAcesso[]> {
    return await invoke<GrupoAcesso[]>("listar_grupos_acesso");
  },

  async salvarGrupo(grupo: GrupoAcesso, permissoes: GrupoAcessoPermissao[]): Promise<GrupoAcesso> {
    return await invoke<GrupoAcesso>("salvar_grupo_acesso", { grupo, permissoes });
  },

  async excluirGrupo(grupoId: string): Promise<void> {
    return await invoke<void>("excluir_grupo_acesso", { grupoId });
  },

  async listarPermissoesGrupo(grupoId: string): Promise<GrupoAcessoPermissao[]> {
    return await invoke<GrupoAcessoPermissao[]>("listar_permissoes_grupo", { grupoId });
  },

  async verificarPermissao(funcionarioId: string, modulo: string, acao: string): Promise<boolean> {
    return await invoke<boolean>("verificar_permissao", { funcionarioId, modulo, acao });
  },

  // Metas
  async listarMetas(funcionarioId: string, ano: number): Promise<FuncionarioMeta[]> {
    return await invoke<FuncionarioMeta[]>("listar_funcionario_metas", { funcionarioId, ano: Math.floor(ano) });
  },

  async salvarMeta(meta: FuncionarioMeta): Promise<FuncionarioMeta> {
    return await invoke<FuncionarioMeta>("salvar_funcionario_meta", { meta });
  },

  // Filiais
  async listarFiliais(funcionarioId: string): Promise<FuncionarioFilial[]> {
    return await invoke<FuncionarioFilial[]>("listar_funcionario_filiais", { funcionarioId });
  },

  async salvarFilial(filial: FuncionarioFilial): Promise<FuncionarioFilial> {
    return await invoke<FuncionarioFilial>("salvar_funcionario_filial", { filial });
  },
};

// Default empty funcionario factory
export function createEmptyFuncionario(empresaId: string): Funcionario {
  return {
    id: '',
    codigo: '',
    nome: '',
    tipo_pessoa: 'FISICA',
    tipo_funcionario: 'FUNCIONARIO',
    salario: 0,
    tem_acesso_sistema: 0,
    status: 'ATIVO',
    forcar_troca_senha: 0,
    tentativas_login_falhas: 0,
    comissao_percentual: 0,
    comissao_tipo_calculo: 'PERCENTUAL_DIRETO',
    comissao_libera_emissao_pct: 0,
    comissao_libera_baixa_pct: 100,
    comissao_desconta_icms: 1,
    comissao_desconta_pis_cofins: 1,
    comissao_inclui_ipi: 0,
    comissao_dia_pagamento: 10,
    desconto_maximo_permitido: 0,
    empresa_id: empresaId,
    acesso_todas_empresas: 0,
    uf: 'MS',
  };
}
