// 子系统可见性：admin 与 user1 可访问全部子系统，user2-user11 仅可访问考古日记与田野考古发掘系统。
// user1 与 admin 的区别保留在各子系统内部的 `role === 'admin'` 判断（删除、备份等管理权限）。
export function canAccessAllSubsystems(role: string, username: string): boolean {
  return role === 'admin' || username === 'user1';
}
