import 'egg';
import { Connection, Model } from 'mongoose'
import * as OSS from 'ali-oss'
import { Options } from 'ali-oss'
declare module 'egg' {
  interface Context {
    genHash(plainText: string): Promise<string>,
    compare(plainText: string, hash: string): Promise<boolean>,
    oss: OSS
  }
  interface EggAppConfig {
    bcrypt: {
      saltRounds: number;
    },
    oss: {
      client?: Options;
    }
  }
  interface Application {
    sessionMap: {
      [key: string]: any
    },
    sessionStore: any
  }
}