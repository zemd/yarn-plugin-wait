import { CommandContext, Plugin } from '@yarnpkg/core';
import { Command, Option } from 'clipanion';
import spinners from 'cli-spinners';
import timestring from 'timestring';
import logUpdate from 'log-update';
import chalk from 'chalk';
import execa from 'execa';
import EventEmitter from 'events';

const spinnerNames = Object.keys(spinners);

// yarn wait 1000 -c "echo Hello World;exit 0;" - waits 5s and executes command
// yarn wait 5000 - waits 5s and exits
// yarn wait 1000 -c "echo Hello World;exit 0;" -w - waits until command returns 0; with timeout 1s
class WaitCommand extends Command<CommandContext> {
  static usage = Command.Usage({
    description: 'Waiting for something',
    details: 'This command will wait defined time',
    examples: [[
      'Wait 2 seconds',
      'yarn wait 2s'
    ]],
  })

  command = Option.String('-c,--command', {
    description: 'Command to be executed after defined time'
  });

  delay = Option.String({
    description: 'Human readable time string, for example, 1s. If no time sign is defined, it\'s meant as milliseconds',
    required: true,
  });

  watch = Option.Boolean('-w,--watch', false, {
    description: 'Watch until command returns error code 0'
  });

  static paths = [[`wait`]];

  private delayMs: number;
  private writeAnimation: Function;
  private currInterval: number;
  private spinner: any;
  private isRunning: boolean = false;
  private eventEmitter: EventEmitter;

  private showSpinner() {
    const spinnerName = spinnerNames[Math.floor(Math.random() * spinnerNames.length - 1)];
    this.spinner = spinners[spinnerName];

    let countDown = this.delayMs;
    let frameInd = 0;

    this.currInterval = setInterval(() => {
      const {frames} = this.spinner;
      const animation = frames[frameInd = ++frameInd % frames.length];
      countDown -= this.spinner.interval;
      const text = ` Waiting for ${timestring(`${countDown}ms`, 's').toFixed(2)} seconds...`;
      this.writeAnimation(`${animation} ${text}`);
    }, this.spinner.interval);
  }

  private clear() {
    if (this.currInterval) {
      clearInterval(this.currInterval)
      this.writeAnimation(``);
    }
  }

  private wait() {
    this.showSpinner();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.clear();
        resolve();
      }, this.delayMs);
    });
  }

  private init() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.on('waitAndRun', async () => {
      await this.waitAndRun(this.watch);
    })

    this.delayMs = timestring(this.delay, 'ms');
    this.writeAnimation = logUpdate.create(this.context.stdout, {
      showCursor: true
    });
  }

  private async waitAndRun(watch = false) {
    if (this.isRunning) {
      return
    }
    this.isRunning = true;
    await this.wait();
    if (this.command) {
      this.context.stdout.write(`> Executing ${chalk.cyan(this.command)}\n`);
      this.context.stdout.write(`> Using cwd: ${chalk.blue(this.context.cwd)}\n\n`);
      try {
        const result = execa.commandSync(this.command.trim(), {
          cwd: this.context.cwd,
          stdout: this.context.stdout,
          stderr: this.context.stderr,
        });
        if (watch && result.exitCode > 0) {
          this.isRunning = false;
          this.eventEmitter.emit('waitAndRun')
        }
      } catch(error) {
        this.isRunning = false;
        this.eventEmitter.emit('waitAndRun')
      }
    } else {
      this.isRunning = false;
    }
  }

  async execute() {
    this.init();
    this.eventEmitter.emit('waitAndRun')
  }
}

const plugin: Plugin = {
  commands: [
    WaitCommand,
  ],
};

export default plugin;
