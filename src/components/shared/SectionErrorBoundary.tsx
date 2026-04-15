import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Compact inline fallback vs full-page */
  section?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Granular error boundary for individual page sections.
 * Shows a compact retry UI instead of crashing the entire page.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary:${this.props.section || "unknown"}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/30 bg-card/40 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {this.props.section ? `Erro ao carregar ${this.props.section}` : "Algo deu errado nesta seção"}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
