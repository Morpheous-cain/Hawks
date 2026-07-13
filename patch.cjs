const fs = require('fs');
const content = fs.readFileSync('src/components/auth/RequireRole.tsx', 'utf8');

const newContent = content.replace(
  `  if (!allowed) {
    logAudit({
      module: "access_control",
      action: "route_access_denied",
      recordId: user.id,
      changes: {
        user_role: userRole ?? "none",
        path: typeof window !== "undefined" ? window.location.pathname : null,
        allowed_roles: allowedRoles ?? "console_roles",
      },
    });

    return (`,
  `  // eslint-disable-next-line react-hooks/rules-of-hooks
  require('react').useEffect(() => {
    if (!allowed && user) {
      logAudit({
        module: "access_control",
        action: "route_access_denied",
        recordId: user.id,
        changes: {
          user_role: userRole ?? "none",
          path: typeof window !== "undefined" ? window.location.pathname : null,
          allowed_roles: allowedRoles ?? "console_roles",
        },
      });
    }
  }, [allowed, user, userRole, allowedRoles]);

  if (!allowed) {
    return (`
);

fs.writeFileSync('src/components/auth/RequireRole.tsx', newContent);
