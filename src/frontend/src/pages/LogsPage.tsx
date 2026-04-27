import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteLog, useLogs, useUpdateLog } from "@/hooks/useQueries";
import { type Log, formatTimestamp } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ---- Excel/CSV export ----
function exportToCSV(logs: Log[]) {
  const headers = [
    "ID",
    "Type",
    "Product",
    "Size",
    "Qty",
    "User",
    "Remark",
    "Edited",
    "Edited By",
    "Timestamp",
  ];
  const rows = logs.map((l) => [
    l.id,
    l.logType,
    `"${l.productName.replace(/"/g, '""')}"`,
    l.size,
    l.logType === "IN" ? `+${l.qty}` : `-${l.qty}`,
    `"${l.userName.replace(/"/g, '""')}"`,
    `"${l.remark.replace(/"/g, '""')}"`,
    l.hasBeenEdited ? "Yes" : "No",
    l.editedBy ?? "",
    formatTimestamp(l.timestamp),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ww-stock-logs-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Edit inline state ----
interface EditState {
  logId: number;
  remark: string;
}

// ---- Log row ----
interface LogRowProps {
  log: Log;
  index: number;
  isAdmin: boolean;
  currentUserId: string;
  onEdit: (log: Log) => void;
  onDelete: (log: Log) => void;
  editState: EditState | null;
  onEditChange: (val: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  isSaving: boolean;
}

function LogRow({
  log,
  index,
  isAdmin,
  currentUserId,
  onEdit,
  onDelete,
  editState,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSaving,
}: LogRowProps) {
  const isIn = log.logType === "IN";
  const isEditing = editState?.logId === log.id;

  // Show edit button if: admin OR (own entry AND not yet edited)
  const canEdit =
    isAdmin || (currentUserId === log.userId && !log.hasBeenEdited);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${
        index % 2 === 0 ? "bg-card" : "bg-muted/20"
      }`}
      data-ocid={`logs.item.${index + 1}`}
    >
      {/* Type badge */}
      <div className="shrink-0 mt-0.5">
        <Badge
          variant="outline"
          className={`text-xs font-mono font-bold w-12 justify-center ${
            isIn
              ? "border-green-500/40 text-green-500 bg-green-500/10"
              : "border-red-500/40 text-red-500 bg-red-500/10"
          }`}
        >
          {isIn ? (
            <span className="flex items-center gap-1">
              <ArrowUp size={10} className="text-green-500" />
              IN
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ArrowDown size={10} className="text-red-500" />
              OUT
            </span>
          )}
        </Badge>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-foreground text-sm truncate">
            {log.productName}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Size: <span className="text-foreground font-bold">{log.size}</span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Qty:{" "}
            <span
              className={`font-bold ${isIn ? "text-green-500" : "text-red-500"}`}
            >
              {isIn ? "+" : "-"}
              {log.qty}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">
            by <span className="text-foreground">{log.userName}</span>
          </span>
          {!isEditing && log.remark && (
            <span className="text-xs text-muted-foreground italic">
              "{log.remark}"
            </span>
          )}
          {log.hasBeenEdited && (
            <span className="text-xs text-muted-foreground/60 italic">
              edited{log.editedBy ? ` by ${log.editedBy}` : ""}
            </span>
          )}
        </div>

        {/* Inline remark edit */}
        {isEditing && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={editState.remark}
              onChange={(e) => onEditChange(e.target.value)}
              placeholder="Edit remark…"
              className="h-7 text-xs"
              data-ocid={`logs.edit_input.${index + 1}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditSave();
                if (e.key === "Escape") onEditCancel();
              }}
            />
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={onEditSave}
              disabled={isSaving}
              data-ocid={`logs.edit_save_button.${index + 1}`}
            >
              {isSaving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={onEditCancel}
              data-ocid={`logs.edit_cancel_button.${index + 1}`}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Timestamp + actions */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-xs font-mono text-muted-foreground">
          {formatTimestamp(log.timestamp)}
        </span>
        <div className="flex items-center gap-1">
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => onEdit(log)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Edit remark"
              data-ocid={`logs.edit_button.${index + 1}`}
            >
              <Pencil size={12} />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(log)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete log"
              data-ocid={`logs.delete_button.${index + 1}`}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main page ----
export default function LogsPage() {
  const { session, isAdmin } = useAuth();
  const { data: logs, isLoading, error } = useLogs();
  const updateLogMutation = useUpdateLog();
  const deleteLogMutation = useDeleteLog();

  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Log | null>(null);

  function handleEditStart(log: Log) {
    setEditState({ logId: log.id, remark: log.remark });
  }

  function handleEditCancel() {
    setEditState(null);
  }

  async function handleEditSave() {
    if (!editState || !session) return;
    const result = await updateLogMutation.mutateAsync({
      logId: editState.logId,
      newRemark: editState.remark,
      callerUserId: session.userId,
    });
    if (result.success) {
      toast.success("Remark updated");
      setEditState(null);
    } else {
      toast.error(result.error ?? "Failed to update remark");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !session) return;
    const result = await deleteLogMutation.mutateAsync({
      adminUserId: session.userId,
      logId: deleteTarget.id,
    });
    if (result.success) {
      toast.success("Log entry deleted");
    } else {
      toast.error(result.error ?? "Failed to delete log");
    }
    setDeleteTarget(null);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
              {isAdmin ? "Admin" : "All Users"}
            </p>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
              Activity Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              All stock movements, most recent first
            </p>
          </div>
          {isAdmin && logs && logs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(logs)}
              className="shrink-0 gap-2"
              data-ocid="logs.export_button"
            >
              <Download size={14} />
              Export CSV
            </Button>
          )}
        </div>

        {isLoading && (
          <div
            className="flex items-center justify-center py-12 text-muted-foreground"
            data-ocid="logs.loading_state"
          >
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading logs…</span>
          </div>
        )}

        {error && (
          <div
            className="text-center py-12 text-destructive text-sm"
            data-ocid="logs.error_state"
          >
            Failed to load logs. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <div
            className="bg-card border border-border rounded-sm overflow-hidden"
            data-ocid="logs.list"
          >
            {/* Table header */}
            <div className="grid grid-cols-[50px_1fr_auto] items-center gap-4 px-4 py-2 bg-muted border-b border-border">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                Type
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase">
                Details
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase text-right">
                Time / Actions
              </span>
            </div>

            {!logs || logs.length === 0 ? (
              <div
                className="py-12 text-center text-muted-foreground text-sm"
                data-ocid="logs.empty_state"
              >
                No activity logs yet
              </div>
            ) : (
              logs.map((log, i) => (
                <LogRow
                  key={log.id}
                  log={log}
                  index={i}
                  isAdmin={isAdmin}
                  currentUserId={session?.userId ?? ""}
                  onEdit={handleEditStart}
                  onDelete={setDeleteTarget}
                  editState={editState}
                  onEditChange={(val) =>
                    setEditState((s) => (s ? { ...s, remark: val } : null))
                  }
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  isSaving={updateLogMutation.isPending}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="logs.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete Log Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this log entry for{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.productName}
            </span>{" "}
            ({deleteTarget?.logType} {deleteTarget?.qty} × {deleteTarget?.size}
            )? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="logs.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLogMutation.isPending}
              data-ocid="logs.delete_confirm_button"
            >
              {deleteLogMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
