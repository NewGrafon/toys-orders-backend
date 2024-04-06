export interface ICacheKeys {
  user(id: string | number): string;

  allUsers(): string;

  toyById(id: string | number): string;

  toyByCode(code: number): string;

  allToys(): string;

  ordersByCartTimestamp(cartTimestamp: string | number): string;

  orderById(id: string | number): string;

  allOrders(): string;
}
