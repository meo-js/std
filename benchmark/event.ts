import { Bench } from 'tinybench';
import { Event, EventEmitter } from '../src/event.js';

function logTitle(title: string) {
  console.log(`\n${title}`);
}

const REPEAT = 1000;

async function run() {
  // Event: emit with 1 listener.
  {
    const event = new Event<unknown[]>();
    event.on(() => {
      // do nothing
    });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit();
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        event.emit(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for Event: emit with 1 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // EventEmitter: emit with 1 listener.
  {
    const emitter = new EventEmitter();
    emitter.on('a', () => {
      // do nothing
    });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a');
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        emitter.emit('a', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for EventEmitter: emit with 1 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // Event: emit with 5 listeners.
  {
    const event = new Event<unknown[]>();
    for (let i = 0; i < 5; i++)
      event.on(() => {
        // do nothing
      });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit();
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        event.emit(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for Event: emit with 5 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // EventEmitter: emit with 5 listeners.
  {
    const emitter = new EventEmitter();
    for (let i = 0; i < 5; i++)
      emitter.on('a', () => {
        // do nothing
      });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a');
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        emitter.emit('a', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for EventEmitter: emit with 5 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // Event: emit with 500 listeners.
  {
    const event = new Event<unknown[]>();
    for (let i = 0; i < 500; i++)
      event.on(() => {
        // do nothing
      });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit();
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) event.emit(1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        event.emit(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for Event: emit with 500 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // EventEmitter: emit with 500 listeners.
  {
    const emitter = new EventEmitter();
    for (let i = 0; i < 500; i++)
      emitter.on('a', () => {
        // do nothing
      });
    const bench = new Bench({ time: 500 });
    bench.add('no args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a');
    });
    bench.add('1 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1);
    });
    bench.add('3 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3);
    });
    bench.add('5 args.', () => {
      for (let i = 0; i < REPEAT; i++) emitter.emit('a', 1, 2, 3, 4, 5);
    });
    bench.add('10 args.', () => {
      for (let i = 0; i < REPEAT; i++)
        emitter.emit('a', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    });
    logTitle('Benchmark for EventEmitter: emit with 500 listeners.');
    await bench.run();
    console.table(bench.table());
  }

  // Once and emit.
  {
    const event = new Event<unknown[]>();
    const emitter = new EventEmitter();
    const bench = new Bench({ time: 500 });
    bench.add('Event with single.', () => {
      let acc = 0;
      for (let i = 0; i < REPEAT; i++) {
        event.once(() => {
          acc++;
        });
        event.emit(1);
      }
    });
    bench.add('Event with multiple.', () => {
      let acc = 0;
      for (let i = 0; i < REPEAT; i++) {
        event.once(() => {
          acc++;
        });
        event.once(() => {
          acc++;
        });
        event.emit(1);
      }
    });
    bench.add('EventEmitter with single.', () => {
      let acc = 0;
      for (let i = 0; i < REPEAT; i++) {
        emitter.once('a', () => {
          acc++;
        });
        emitter.emit('a', 1);
      }
    });
    bench.add('EventEmitter with multiple.', () => {
      let acc = 0;
      for (let i = 0; i < REPEAT; i++) {
        emitter.once('a', () => {
          acc++;
        });
        emitter.once('a', () => {
          acc++;
        });
        emitter.emit('a', 1);
      }
    });
    logTitle('Benchmark for once and emit.');
    await bench.run();
    console.table(bench.table());
  }

  // On and off.
  {
    const bench = new Bench({ time: 500 });
    bench.add('Event', () => {
      for (let i = 0; i < REPEAT; i++) {
        const event = new Event();
        let x = 0;
        const fn = () => {
          x++;
        };
        event.on(fn);
        event.off(fn);
      }
    });
    bench.add('EventEmitter', () => {
      for (let i = 0; i < REPEAT; i++) {
        const emitter = new EventEmitter();
        let x = 0;
        const fn = () => {
          x++;
        };
        emitter.on('a', fn);
        emitter.off('a', fn);
      }
    });
    logTitle('Benchmark for on and off.');
    await bench.run();
    console.table(bench.table());
  }
}

await run();
