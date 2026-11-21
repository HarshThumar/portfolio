type EventHandler<T> = (data: T) => void;

export class TypedEmitter<Events extends object> {
  private listeners: { [K in keyof Events]?: Array<EventHandler<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    const list = this.listeners[event] ?? [];
    list.push(handler);
    this.listeners[event] = list;

    return () => {
      this.off(event, handler);
    };
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((h) => h !== handler);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const list = this.listeners[event];
    if (!list) return;
    for (const handler of list) {
      handler(data);
    }
  }

  clear(): void {
    this.listeners = {};
  }
}
