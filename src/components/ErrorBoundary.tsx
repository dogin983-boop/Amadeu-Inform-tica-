import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Erro de Permissão no Firestore: ${parsed.operationType} em ${parsed.path || 'caminho desconhecido'}.`;
          }
        }
      } catch (e) {
        // Not a JSON error message, use default
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 border border-red-100">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Ops! Algo deu errado</h1>
              <p className="text-gray-600 text-sm">
                {isFirestoreError 
                  ? "Parece que você não tem permissão para realizar esta ação ou houve um problema de segurança."
                  : "Não conseguimos processar sua solicitação no momento."}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
              <p className="text-xs font-mono text-red-600 break-words">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-gray-500 hover:text-royal-blue text-sm font-semibold flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Voltar para o Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
