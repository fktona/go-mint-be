import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
// @ts-ignore
export class DynamicStrategy extends PassportStrategy(Strategy, 'dynamic') {
  private _callbackURL: string;
  
  constructor(
    private readonly configService: ConfigService,
  ) {
    super();
  }
  
 async authenticate(req: any, options) {
  const callback = this.configService.get(`${req?.params?.provider.toUpperCase()}_CALLBACK_URL`);
  const isCallback = req.url.includes('callback');
  const provider = req?.params?.provider;
  const stateId = req?.query?.stateid || req?.params?.id || options?.state || "default";
  
  console.log('DynamicStrategy authenticate called', { isCallback, provider, stateId });
  
  try {
    // Get the strategy that was attached to the request by DynamicAuthGuard
    const strategy = req.strategy;
    
    if (!strategy) {
      return this.fail('No strategy provided', 401);
    }
    
    // Set up strategy callbacks
    strategy.fail = (challenge: any, status: any) => this.fail(challenge, status);
    strategy.redirect = (url: string, status?: number) => this.redirect(url, status);
    strategy.error = (err: Error) => this.error(err);
    strategy.success = (user: any, info?: any) => {
      // Add the custom data to the user object
      if (req.customData) {
        user.customData = req.customData;
      }
      this.success(user, info);
    };
    
    // Set the base callback URL
    options.callbackURL = callback;

    if (!isCallback) {
      // Initial authorization phase
      // Store our custom data separately without interfering with OAuth state
      req.session = req.session || {};
      req.session.customData = {
        stateId: stateId,
        provider: provider
      };
      
      console.log('Initial auth: storing custom data in session');
      
      // DO NOT override the state parameter - let the strategy handle it
      // options.state = Buffer.from(stateData).toString('base64'); <-- REMOVE THIS
    } else {
      // During callback phase
      if (req.session && req.session.customData) {
        console.log('Callback phase: retrieved custom data from session', req.session.customData);
        req.customData = req.session.customData;
      }
      
      // Don't modify the state parameter here either
      // Just let the OAuth library handle it
    }
    
    // Enhanced debugging
    console.log('Strategy options:', {
      callbackURL: options.callbackURL,
      state: options.state ? 'Managed by OAuth library' : 'Not present',
      isCallback
    });
    
    // Execute the actual strategy
    await strategy.authenticate(req, options);
  } catch (error) {
    console.error('Dynamic strategy error:', error);
    this.error(error);
  }
}
}