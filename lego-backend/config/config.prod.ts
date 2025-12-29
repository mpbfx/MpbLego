import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.baseUrl = 'prod.url'
  config.mongoose = {
    url: 'mongodb://lego-mongo:27017/lego',
    options: {
      user: process.env.MONGO_DB_USERNAME,
      pass: process.env.MONGO_DB_PASSWORD
    }
  }
  config.redis = {
    client: {
      port: 6379,
      host: 'lego-redis',
      password: process.env.REDIS_PASSWORD
    }
  }
  // 2 配置 cors 允许的域名
  config.security = {
    domainWhiteList: [ 'https://imooc-lego.com', 'https://www.imooc-lego.com' ]
  }
  // 3 配置对应的 jwt 过期时间
  config.jwtExpires = '2 days'
  // 4 本地的URL 替换
  config.giteeOauthConfig = {
    redirectURL: 'https://api.imooc-lego.com/api/users/passport/gitee/callback'
  }
  config.H5BaseURL = 'https://h5.imooc-lego.com'
  return config;
};
