import { useState } from "react";
import { redirect, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/team";
import { api } from "~/lib/api/client";
import { requireAuth } from "~/lib/api/auth";
import { canSeeNav } from "~/lib/utils/rbac";
import { initials } from "~/lib/utils/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { canonicalRole } from "~/lib/utils/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import { AppRole, enumKey, enumNames } from "~/lib/types/enums";
import type { AppUserResponsePaginatedResponse, UserResponse } from "~/lib/types/api";

const PAGE_SIZE = 20;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "team")) throw redirect("/dashboard");
  const requestedPage = Number(
    new URL(request.url).searchParams.get("page"),
  );
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return {
    users: api.users({ pageNumber, pageSize: PAGE_SIZE }).catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies AppUserResponsePaginatedResponse,
    ),
  };
}

const ROLES = enumNames(AppRole);

export default function Team({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleFor, setRoleFor] = useState<UserResponse | null>(null);

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  async function deactivate(u: UserResponse) {
    await api.deactivateUser(u.id);
    toast.success("User deactivated");
    revalidator.revalidate();
  }

  return (
    <PageWrap>
      <PageHeader
        title="Team"
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <Icon name="plus" size={16} />
            Invite user
          </Button>
        }
      />
      <Resolve resolve={loaderData.users} fallback={<TableSkeleton cols={5} />}>
        {(usersPage) => {
          const users = usersPage.items ?? [];
          return (
            <>
              <DataTable<UserResponse>
                rows={users}
                empty="No team members yet."
                columns={[
                  {
                    key: "user",
                    header: "Member",
                    cell: (r) => (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-raised font-mono text-[12px] font-bold text-foreground">
                          {initials(r.fullName || r.email)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-foreground">
                            {r.fullName || "—"}
                          </div>
                          <div className="text-[11.5px] text-dim">
                            {r.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "role",
                    header: "Role",
                    cell: (r) => (
                      <StatusBadge
                        status={enumKey(AppRole, r.role)}
                        dot={false}
                      />
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (r) => (
                      <StatusBadge
                        status={r.isActive ? "Active" : "Inactive"}
                      />
                    ),
                  },
                  {
                    key: "linked",
                    header: "Linked",
                    cell: (r) => (
                      <StatusBadge
                        status={r.isLinked ? "Linked" : "NotLinked"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    align: "right",
                    width: "48px",
                    cell: (r) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex justify-end text-dim hover:text-foreground">
                            <Icon name="dots" size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setRoleFor(r)}>
                            Change role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deactivate(r)}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ),
                  },
                ]}
              />

              {usersPage.totalCount > usersPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(usersPage.pageNumber - 1) * usersPage.pageSize + 1}–
                    {Math.min(
                      usersPage.pageNumber * usersPage.pageSize,
                      usersPage.totalCount,
                    )}{" "}
                    of {usersPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={usersPage.pageNumber <= 1}
                      onClick={() => navigatePage(usersPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        usersPage.pageNumber * usersPage.pageSize >=
                        usersPage.totalCount
                      }
                      onClick={() => navigatePage(usersPage.pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </Resolve>

      <FormDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite user"
        description="Send an invitation email with an assigned role."
        submitLabel="Send invite"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
            full: true,
          },
          { name: "fullName", label: "Full name", full: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            required: true,
            full: true,
            defaultValue: "Staff",
            options: ROLES.map((r) => ({ value: r, label: r })),
          },
        ]}
        onSubmit={async (v) => {
          await api.inviteUser({
            email: v.email,
            fullName: v.fullName || null,
            role: AppRole[v.role as keyof typeof AppRole],
          });
          toast.success("Invitation sent");
          revalidator.revalidate();
        }}
      />

      {roleFor && (
        <FormDialog
          open={!!roleFor}
          onOpenChange={(o) => !o && setRoleFor(null)}
          title="Change role"
          description={`Update the role for ${roleFor.fullName || roleFor.email}.`}
          submitLabel="Update role"
          fields={[
            {
              name: "role",
              label: "Role",
              type: "select",
              required: true,
              full: true,
              defaultValue:
                (typeof roleFor.role === "number"
                  ? enumKey(AppRole, roleFor.role)
                  : canonicalRole(roleFor.role as string)) ?? "Staff",
              options: ROLES.map((r) => ({ value: r, label: r })),
            },
          ]}
          onSubmit={async (v) => {
            await api.updateUserRole(roleFor.id, {
              role: AppRole[v.role as keyof typeof AppRole],
            });
            toast.success("Role updated");
            setRoleFor(null);
            revalidator.revalidate();
          }}
        />
      )}
    </PageWrap>
  );
}
