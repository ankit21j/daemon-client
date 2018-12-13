// import * as logger from "winston"

// import { db } from "../db"

// let clientConfig = {}

// export const initManager = () => {
//   db.collection('clientConfig').find({ 'authToken' : { '$exists' : true }}).toArray(async (err, items) => {
//     if(err){
//       logger.error(err)
//     }
//     setDefaults((items))
//   })
// }

// const setDefaults = (req) => {

//   //default client config
//   clientConfig = Object.assign({}, req[0])

//   let enabledSkus = clientConfig['skus']['enabledSkus']
//   let enabledLines = clientConfig['lines']['enabledLines']

//   for(let sku in enabledSkus){
//     for(let line of enabledLines){

//     }
//   }
// }
