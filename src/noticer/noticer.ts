import { Client, createClient } from 'oicq';
import { join } from 'path';

import { NoticerConfig } from '@/config/app-config.schema';
import { Logger } from '@/logger';

export class Noticer {
  private readonly client: Client;
  constructor(private readonly noticerConfig: NoticerConfig) {
    if (!this.noticerConfig.enable) return;
    this.client = createClient(noticerConfig.qq, {
      platform: 3,
      log_level: 'off',
      data_dir: join(__dirname, '..', '..', 'data'),
    });
    this.client
      .on('system.login.device', event => {
        Logger.error(event.url);
        Logger.error('Please Enter This Url to Finish Device Lock');
        process.exit(-1);
      })
      .login(noticerConfig.password);
    Logger.info(`Noticer QQ ${noticerConfig.qq} Logged Succeed`);
  }

  async sendMessage(msg: string, qq: number): Promise<void> {
    if (!this.noticerConfig.enable) return;
    Logger.info(`Sending Message to ${qq} ...`);
    try {
      let counter = 0;
      while (true) {
        const result = await this.client.sendPrivateMsg(qq, msg);
        counter++;
        if (!result.error) break;
        Logger.warn(`Sending Message to ${qq} Fail, Msg: ${result.error.message}`);
        if (counter > 3) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(result.error.message);
        }
      }
      Logger.info(`Sending Message to ${qq} Succeed`);
    } catch (e) {
      Logger.error(e);
    }
  }
}
