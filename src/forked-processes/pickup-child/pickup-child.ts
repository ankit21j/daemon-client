import * as fs from "fs"
import * as logger from "winston"


export const checkPresentFiles = (fileLocation) => {
  logger.info(fileLocation);
}

process.on('message', async (fileLocation) => {
  await checkPresentFiles(fileLocation);
});


logger.info('inside pickup child');
