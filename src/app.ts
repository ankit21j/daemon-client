import * as express from "express"
import * as bodyParser from "body-parser"

const app = express()

app.set("port", 8999)

app.use(bodyParser.json())

export = app
