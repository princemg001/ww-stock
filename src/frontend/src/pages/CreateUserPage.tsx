import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCreateUser, useListUsers, useRemoveUser } from "@/hooks/useQueries";
import type { UserPublic } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

interface UserRowProps {
  user: UserPublic;
  index: number;
  onDelete: (user: UserPublic) => void;
  currentUserId: string;
}

function UserRow({ user, index, onDelete, currentUserId }: UserRowProps) {
  const isSelf = user.userId === currentUserId;
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
      data-ocid={`users.item.${index}`}
    >
      <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
        {user.role === "admin" || user.role === "owner" ? (
          <ShieldCheck size={14} className="text-primary" />
        ) : (
          <User size={14} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user.userName}
        </p>
        <p className="text-xs font-mono text-muted-foreground">{user.userId}</p>
      </div>
      <Badge
        variant={
          user.role === "admin" || user.role === "owner"
            ? "default"
            : "secondary"
        }
        className="text-xs font-mono shrink-0"
      >
        {user.role.toUpperCase()}
      </Badge>
      {!isSelf && (
        <button
          type="button"
          onClick={() => onDelete(user)}
          className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          aria-label={`Delete ${user.userName}`}
          data-ocid={`users.delete_button.${index}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const adminUserId = session?.userId ?? "";

  const createMutation = useCreateUser();
  const removeMutation = useRemoveUser();
  const { data: users, isLoading: loadingUsers } = useListUsers(adminUserId);

  const [newUserId, setNewUserId] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "owner">("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<UserPublic | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!newUserId.trim()) {
      setError("User ID is required");
      return;
    }
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    const result = await createMutation.mutateAsync({
      adminUserId,
      newUserId: newUserId.trim(),
      pin,
      name: name.trim(),
      role,
    });

    if (result.success) {
      setSuccess(true);
      setNewUserId("");
      setName("");
      setPin("");
      setRole("user");
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(result.error ?? "Failed to create user");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    const result = await removeMutation.mutateAsync({
      adminUserId,
      targetUserId: deleteTarget.userId,
    });
    if (result.success) {
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Failed to remove user");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
            aria-label="Go back"
            data-ocid="create_user.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Admin
            </p>
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
              Manage Users
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create user form */}
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Create New User
            </h2>
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-sm p-4 space-y-4"
              data-ocid="create_user.form"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="newUserId"
                  className="text-sm font-medium text-foreground"
                >
                  User ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newUserId"
                  type="text"
                  value={newUserId}
                  onChange={(e) => {
                    setNewUserId(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. john001"
                  className="bg-background border-border font-mono"
                  data-ocid="create_user.userid_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. John Smith"
                  className="bg-background border-border"
                  data-ocid="create_user.name_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="newPin"
                  className="text-sm font-medium text-foreground"
                >
                  4-Digit PIN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPin"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                    setError("");
                  }}
                  placeholder="• • • •"
                  className="bg-background border-border font-mono text-center tracking-[0.5em]"
                  data-ocid="create_user.pin_input"
                />
                <p className="text-xs text-muted-foreground">
                  4 numeric digits only
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="roleSelect"
                  className="text-sm font-medium text-foreground"
                >
                  Role
                </Label>
                <select
                  id="roleSelect"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "user" | "admin" | "owner")
                  }
                  className="w-full h-9 rounded-sm border border-input bg-background px-3 py-1 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  data-ocid="create_user.role_select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
                  data-ocid="create_user.error_state"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div
                  className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-sm px-3 py-2"
                  data-ocid="create_user.success_state"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>User created successfully!</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                data-ocid="create_user.submit_button"
              >
                {createMutation.isPending ? (
                  "Creating…"
                ) : (
                  <>
                    <Users size={15} />
                    Create User
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Users list */}
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Registered Users
            </h2>
            <div
              className="bg-card border border-border rounded-sm p-4"
              data-ocid="users.list"
            >
              {loadingUsers ? (
                <div className="space-y-3" data-ocid="users.loading_state">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <Skeleton className="w-8 h-8 rounded-sm" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-12 rounded-sm" />
                    </div>
                  ))}
                </div>
              ) : !users || users.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="users.empty_state"
                >
                  <Users size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No users registered yet</p>
                </div>
              ) : (
                <div>
                  {users.map((user, i) => (
                    <UserRow
                      key={user.userId}
                      user={user}
                      index={i + 1}
                      onDelete={setDeleteTarget}
                      currentUserId={adminUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent data-ocid="users.dialog">
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.userName}
              </span>{" "}
              ({deleteTarget?.userId})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError("");
              }}
              data-ocid="users.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={removeMutation.isPending}
              data-ocid="users.confirm_button"
            >
              {removeMutation.isPending ? "Removing…" : "Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
