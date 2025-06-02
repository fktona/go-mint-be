interface IAppConfig {
  PRIVY_SECRET: string;
  PRIVY_APP_ID: string;
}

const appConfig = (): IAppConfig => ({
  PRIVY_SECRET: process.env.PRIVY_API_SECRET as string, 
  PRIVY_APP_ID: process.env.PRIVY_APP_ID as string,
});

export default appConfig;
