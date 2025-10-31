import { makeAutoObservable } from 'mobx'

export class CounterStore {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }

  reset() {
    this.count = 0
  }
}

let counterStore: CounterStore

export function useCounterStore(): CounterStore {
  if (!counterStore) {
    counterStore = new CounterStore()
  }
  return counterStore
}
