export interface ICacheKeys {
  user(id: string | number): string;

  allUsers(): string;

  toy(id: string | number): string;

  allToys(): string;

  ordersByCartTimestamp(cartTimestamp: string | number): string;

  orderById(id: string | number): string;

  allOrders(): string;
}
