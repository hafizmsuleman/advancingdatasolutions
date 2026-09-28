import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
  destructive?: boolean;
  input?: { label: string; value: string; onChange: (value: string) => void; note?: string; maxLength?: number; multiline?: boolean } | undefined;
};

export function ActionDialog({ open, onOpenChange, title, confirmLabel, onConfirm, busy, destructive, input }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-xl border-border bg-card text-foreground shadow-lg sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {input && (
          <div className="space-y-2">
            <label htmlFor="action-dialog-input" className="text-sm font-medium">{input.label}</label>
            {input.multiline ? (
              <textarea id="action-dialog-input" rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={input.value} maxLength={input.maxLength} onChange={(e) => input.onChange(e.target.value)} />
            ) : (
              <input id="action-dialog-input" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={input.value} maxLength={input.maxLength} onChange={(e) => input.onChange(e.target.value)} />
            )}
            {input.note && <DialogDescription>{input.note}</DialogDescription>}
          </div>
        )}
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" type="button" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} type="button" disabled={busy} onClick={() => void onConfirm()}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}