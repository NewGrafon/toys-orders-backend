export interface ICacheKeys {
  user(id: string | number): string;

  allUsers(): string;

  order(id: string | number): string;

  allOrders(): string;
}
