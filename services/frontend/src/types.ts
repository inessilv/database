export type Role = "admin" | "viewer";

export type User = {
    username: string;
    role: Role;
};
