export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    interests: user.interests ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
