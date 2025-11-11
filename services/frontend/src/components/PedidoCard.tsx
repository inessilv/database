/**
 * PedidoCard Component
 * 
 * Card para mostrar informações de um pedido
 * Inclui ações para aprovar/rejeitar (se pendente)
 */

import type { PedidoComCliente } from "../types/Pedido";

interface PedidoCardProps {
  pedido: PedidoComCliente;
  onAprovar?: (id: string) => void;
  onRejeitar?: (id: string) => void;
  loading?: boolean;
}

export default function PedidoCard({
  pedido,
  onAprovar,
  onRejeitar,
  loading = false,
}: PedidoCardProps) {
  /**
   * Badge de estado com cores
   */
  const getEstadoBadge = () => {
    const badges = {
      pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      aprovado: "bg-green-100 text-green-800 border-green-300",
      rejeitado: "bg-red-100 text-red-800 border-red-300",
    };

    const labels = {
      pendente: "🟡 Pendente",
      aprovado: "🟢 Aprovado",
      rejeitado: "🔴 Rejeitado",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          badges[pedido.estado]
        }`}
      >
        {labels[pedido.estado]}
      </span>
    );
  };

  /**
   * Badge de tipo
   */
  const getTipoBadge = () => {
    const isRenovacao = pedido.tipo_pedido === "renovação";

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isRenovacao
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {isRenovacao ? "📅 Renovação" : "🚫 Revogação"}
      </span>
    );
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Calcular dias até expiração
   */
  const getDiasRestantes = () => {
    const hoje = new Date();
    const expiracao = new Date(pedido.data_expiracao_atual);
    const diff = expiracao.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias;
  };

  const diasRestantes = getDiasRestantes();
  const expirado = diasRestantes < 0;
  const expirandoBreve = diasRestantes > 0 && diasRestantes <= 7;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6">
      {/* Header com badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {getEstadoBadge()}
          {getTipoBadge()}
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(pedido.criado_em)}
        </span>
      </div>

      {/* Informações do cliente */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {pedido.cliente_nome}
        </h3>
        <p className="text-sm text-gray-600">{pedido.cliente_email}</p>
      </div>

      {/* Data de expiração atual */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Data de expiração atual:</p>
        <p
          className={`text-sm font-semibold ${
            expirado
              ? "text-red-600"
              : expirandoBreve
              ? "text-orange-600"
              : "text-gray-900"
          }`}
        >
          {formatDate(pedido.data_expiracao_atual)}
          {expirado && " (Expirado)"}
          {expirandoBreve && ` (${diasRestantes} dias restantes)`}
        </p>
      </div>

      {/* Informações adicionais */}
      {pedido.gerido_por && (
        <div className="mb-4 text-xs text-gray-500">
          <p>
            Processado por: Admin ID {pedido.gerido_por}
          </p>
        </div>
      )}

      {/* Ações (apenas se pendente) */}
      {pedido.estado === "pendente" && onAprovar && onRejeitar && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onAprovar(pedido.id)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                A processar...
              </>
            ) : (
              <>
                ✅ Aprovar (+30 dias)
              </>
            )}
          </button>

          <button
            onClick={() => onRejeitar(pedido.id)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ❌ Rejeitar
          </button>
        </div>
      )}

      {/* Mensagem se não for renovação */}
      {pedido.tipo_pedido === "revogação" && pedido.estado === "pendente" && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-800">
            ⚠️ Pedidos de revogação devem ser tratados manualmente.
          </p>
        </div>
      )}
    </div>
  );
}
