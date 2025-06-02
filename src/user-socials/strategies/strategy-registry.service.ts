import { Injectable } from "@nestjs/common";
import { TwitterStrategy } from "./twitter.strategy";
import { TiktokStrategy } from "./tiktok.strategy";

@Injectable()
export class StrategyRegistryService {
  private strategies = new Map<string, any>();

  constructor(
    private readonly twitterStrategy: TwitterStrategy,
    private readonly tiktokStrategy: TiktokStrategy,
  ) {
    this.registerStrategies();
  }

  private registerStrategies() {
    this.strategies.set('twitter', this.twitterStrategy);
    this.strategies.set('tiktok', this.tiktokStrategy);
  }

  getStrategy(provider: string) {
    return this.strategies.get(provider);
  }
}