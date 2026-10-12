import React, { createContext, useContext, useEffect, useReducer, ReactNode, useRef, useState } from 'react';
import { Expense } from '../types/expense';
import { expenseRepository } from '../storage/expenseRepository';
import { ExpenseMutationStore } from '../storage/expenseMutationStore';
import { limitRepository } from '../storage/limitRepository';

interface State {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  monthlyLimit: number | null;
}

type Action = 
  | { type: 'LOAD_SUCCESS'; payload: { expenses: Expense[]; limit: number | null } }
  | { type: 'EXPENSES_SUCCESS'; payload: Expense[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_LIMIT'; payload: number | null };

const ExpenseContext = createContext<{ 
  state: State; 
  addExpense: (e: Expense) => Promise<void>;
  updateExpense: (id: string, e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyLimit: (yearMonth: string, amount: number) => Promise<void>;
  deleteMonthlyLimit: (yearMonth: string) => Promise<void>;
  retryLoad: () => Promise<void>;
} | undefined>(undefined);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'LOAD_SUCCESS': return { ...state, expenses: action.payload.expenses, monthlyLimit: action.payload.limit, loading: false };
    case 'EXPENSES_SUCCESS': return { ...state, expenses: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    case 'UPDATE_LIMIT': return { ...state, monthlyLimit: action.payload };
    default: return state;
  }
};

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { expenses: [], monthlyLimit: null, loading: true, error: null });
  const mutationStore = useRef(new ExpenseMutationStore(expenseRepository)).current;
  const isInitializing = useRef(true);

  const loadAll = async (yearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const expenses = await mutationStore.load();
      const limit = await limitRepository.getLimit(yearMonth);
      dispatch({ type: 'LOAD_SUCCESS', payload: { expenses, limit } });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Veriler yüklenirken hata oluştu' });
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    const now = new Date();
    loadAll(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
  }, []);

  const addExpense = async (expense: Expense) => {
    const expenses = await mutationStore.add(expense);
    dispatch({ type: 'EXPENSES_SUCCESS', payload: expenses });
  };

  const updateExpense = async (id: string, updated: Expense) => {
    const expenses = await mutationStore.update(id, updated);
    dispatch({ type: 'EXPENSES_SUCCESS', payload: expenses });
  };

  const deleteExpense = async (id: string) => {
    const expenses = await mutationStore.delete(id);
    dispatch({ type: 'EXPENSES_SUCCESS', payload: expenses });
  };

  const setMonthlyLimit = async (yearMonth: string, amount: number) => {
    await limitRepository.setLimit(yearMonth, amount);
    dispatch({ type: 'UPDATE_LIMIT', payload: amount });
  };

  const deleteMonthlyLimit = async (yearMonth: string) => {
    await limitRepository.removeLimit(yearMonth);
    dispatch({ type: 'UPDATE_LIMIT', payload: null });
  };

  return (
    <ExpenseContext.Provider value={{ state, addExpense, updateExpense, deleteExpense, setMonthlyLimit, deleteMonthlyLimit, retryLoad: loadAll }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};
