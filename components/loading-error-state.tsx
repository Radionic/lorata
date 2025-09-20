import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export function LoadingErrorState({
  isLoading,
  error,
  loadingMessage,
  errorTitle: errorMessage,
  onRetry,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  loadingMessage: string;
  errorTitle: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg text-muted-foreground">
            {loadingMessage}
          </span>
        </div>
      )}

      {Boolean(error) && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <h3 className="text-lg font-medium mb-2">{errorMessage}</h3>
          </div>
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      )}

      {!isLoading && !Boolean(error) && children}
    </>
  );
}
