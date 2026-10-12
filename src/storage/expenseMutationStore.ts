import { Expense } from '../types/expense';
import { ExpenseRepository } from './expenseRepository';

export class ExpenseMutationStore {
  private expenses: Expense[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly repository: ExpenseRepository) {}

  private enqueue(operation: () => Promise<Expense[]>): Promise<Expense[]> {
    const result = this.queue.then(operation);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  load(): Promise<Expense[]> {
    return this.enqueue(async () => {
      const loaded = await this.repository.getAll();
      this.expenses = loaded;
      return [...this.expenses];
    });
  }

  add(expense: Expense): Promise<Expense[]> {
    return this.enqueue(async () => {
      if (this.expenses.some((entry) => entry.id === expense.id)) return [...this.expenses];
      const next = [...this.expenses, expense];
      await this.repository.saveAll(next);
      this.expenses = next;
      return [...this.expenses];
    });
  }

  update(id: string, updated: Expense): Promise<Expense[]> {
    return this.enqueue(async () => {
      const next = this.expenses.map((entry) => entry.id === id ? updated : entry);
      await this.repository.saveAll(next);
      this.expenses = next;
      return [...this.expenses];
    });
  }

  delete(id: string): Promise<Expense[]> {
    return this.enqueue(async () => {
      const next = this.expenses.filter((entry) => entry.id !== id);
      await this.repository.saveAll(next);
      this.expenses = next;
      return [...this.expenses];
    });
  }
}
