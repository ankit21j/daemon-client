import * as fs from "fs"
import * as logger from "winston"

const configPath = "/Users/ankitgupta/Documents/test-vj/client-config.json"
let clientConfig = {}

export const main = async() => {
  clientConfig = fs.readFileSync(configPath)
  // logger.info(`${clientConfig}`)

  return new Promise((resolve, reject) => {
    try {
      resolve(clientConfig)      
    } catch (error) {
      logger.error(error)
      reject(error)
    }
  })
}

