// import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { StrategyRegistryService } from 'src/user-socials/strategies/strategy-registry.service';
// import { UserSocialsService } from 'src/user-socials/user-socials.service';

// @Injectable()
// export class DynamicAuthGuard extends AuthGuard('twitter') {
//   constructor(private readonly strategyRegistry: StrategyRegistryService,
//     private readonly userSocialsService: UserSocialsService,
//   ) {
//     super();
//   }

// //   getRequest(context: ExecutionContext) {
// //     const request = context.switchToHttp().getRequest();
// //     return request;
// //   }

// //   getNext(context: ExecutionContext) {
// //     const next = context.switchToHttp().getNext();
// //     return next;
// //   }

// //   // This method provides options to the strategy's authenticate method
// // //  async getAuthenticateOptions(context: ExecutionContext) {
// // //   const request = this.getRequest(context);
  
// // //   // For callback routes, pass through the state from query params
// // //   if (request.route.path.includes('/callback')) {
// // //     console.log('Callback route detected, state param:', request.query.state);
// // //     return {
// // //       state: request.query.state
// // //     };
// // //   }
  
// // //   // For initial auth routes, generate and store state
// // //   const userId = request.params.id;
// // //   if (userId) {
// // //     // Use a consistent method to store state
// // //     const state = userId; // Or generate a more secure state
// // //     console.log(`Setting state parameter: ${state}`);
// // //     return { state };
// // //   }
  
// // //   return {};
// // // }

// //   async canActivate(context: ExecutionContext): Promise<boolean> {
// //     const request = this.getRequest(context);
// //     const provider = request.params.provider;
// //     // Fetch the strategy from the registry
// //     const strategy = this.strategyRegistry.getStrategy(provider);
    
// //     // Check if strategy exists
// //     if (!strategy) {
// //       throw new UnauthorizedException(`Unsupported provider: ${provider}`);
// //     }
  
// //     // Attach the strategy to the request for the DynamicStrategy to use
// //     request.strategy = strategy;
    
// //    // ...existing code...
// // if (request.route.path.includes('/callback')) {

  
  
// // }
    

// //     try {
      
// //       const isAuthenticated = await super.canActivate(context) as boolean;
      
// //       if (!isAuthenticated) {
// //         throw new UnauthorizedException('Authentication failed');
// //       }
      
// //       return true;
// //     } catch (error) {
// //       console.error('Authentication error:', error);
// //       throw new UnauthorizedException('Authentication failed');
// //     }
// //   }
// }






import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyRegistryService } from 'src/user-socials/strategies/strategy-registry.service';
import { UserSocialsService } from 'src/user-socials/user-socials.service';

@Injectable()
export class DynamicAuthGuard extends AuthGuard('dynamic') {
  constructor(
    private readonly strategyRegistry: StrategyRegistryService,
    private readonly userSocialsService: UserSocialsService,
  ) {
    super();
  }


//    async getAuthenticateOptions(context: ExecutionContext) {
//   const request = this.getRequest(context);
  
//   if (request.route.path.includes('/callback')) {
//     console.log('Callback route detected, state param:', request.query.state);
//     return {
//       state: request.query.state
//     };
//   }
  
//   // For initial auth routes, generate and store state
//   const userId = request.params.id;
//   console.log('User ID from params:', userId);
//   if (userId) {
//     // Use a consistent method to store state
//     const state = userId; // Or generate a more secure state
//     console.log(`Setting state parameter: ${state}`);
//     return { state };
//   }
//   return {};
// }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provider = request.params.provider;
    
    // Fetch the strategy from the registry
    const strategy = this.strategyRegistry.getStrategy(provider);
    
    // Check if strategy exists
    if (!strategy) {
      throw new UnauthorizedException(`Unsupported provider: ${provider}`);
    }
  
    // Attach the strategy to the request for later use
    request.strategy = strategy;
    
    try {
      const result = await super.canActivate(context) as boolean;
      
      // After successful authentication, ensure the user profile is available
      const user = context.switchToHttp().getRequest().user;
      const request = context.switchToHttp().getRequest()
      console.log('User profile:', user);
      if (user) {
        request.profile = user;  // Make sure profile is set on the request
      }
      
      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  // Handle the request in case of success
 handleRequest(err: any, user: any, info: any, context: any) {
  // Enhanced logging for debugging
  console.log('DynamicAuthGuard handleRequest called:', {
    hasError: !!err,
    hasUser: !!user,
    info: info,
    userDetails: user ? {
      id: user.id,
      provider: user.provider
      // Add other fields you expect but anonymize sensitive data
    } : 'No user'
  });
  
  if (err) {
    console.error('Authentication error details:', err);
    throw err;
  }
  
  if (!user) {
    console.error('No user returned from strategy', { info });
    throw new UnauthorizedException('User profile not found');
  }
  
  // If we got here, authentication was successful
  const request = context.switchToHttp().getRequest();
  request.profile = user;
  
  return user;
}
}